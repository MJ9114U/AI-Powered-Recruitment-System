import os
import re
import time
from typing import Dict, Any, Optional
import torch
from moviepy import VideoFileClip
import whisper
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from openai import OpenAI
from transformers import pipeline

class VideoEngine:
    def __init__(self):
        # Set device to CPU to avoid GPU dependency
        self.device = "cpu"
        torch.set_num_threads(1)  # Limit threads for low memory usage

        # Load Whisper model (small for efficiency)
        try:
            self.whisper_model = whisper.load_model("small", device=self.device)
        except Exception as e:
            print(f"Failed to load Whisper model: {e}")
            self.whisper_model = None

        # Initialize VADER for sentiment
        self.sentiment_analyzer = SentimentIntensityAnalyzer()

        # OpenAI client for bonus LLM analysis (optional)
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = OpenAI(api_key=openai_key)
        else:
            self.openai_client = None

        # Filler words for clarity analysis
        self.filler_words = {"um", "uh", "like", "you know", "so", "well", "actually", "basically", "literally"}

        self.emotion_model = pipeline(
            "text-classification",
            model="bhadresh-savani/distilbert-base-uncased-emotion",
            return_all_scores=True
        )
    def _extract_audio(self, video_path: str, audio_path: str) -> bool:
        """Extract audio from video using moviepy."""
        try:
            video = VideoFileClip(video_path)
            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
            video.close()
            return True
        except Exception as e:
            print(f"Audio extraction failed: {e}")
            return False

    def _transcribe_audio(self, audio_path: str) -> Optional[str]:
        """Transcribe audio using Whisper."""
        if not self.whisper_model:
            return None
        try:
            result = self.whisper_model.transcribe(audio_path)
            return result["text"].strip()
        except Exception as e:
            print(f"Transcription failed: {e}")
            return None

    def _analyze_clarity(self, transcript: str, duration: float) -> float:
        """Calculate communication clarity score based on WPM and filler words."""
        if not transcript or duration <= 0:
            return 0.0

        words = re.findall(r'\b\w+\b', transcript.lower())
        word_count = len(words)
        wpm = (word_count / duration) * 60

        # Count filler words
        filler_count = sum(1 for word in words if word in self.filler_words)
        filler_density = filler_count / word_count if word_count > 0 else 0

        # Ideal WPM: 120-160, penalize too slow/fast
        wpm_score = max(0, min(100, 100 - abs(140 - wpm) * 2))

        # Filler score: lower density is better
        filler_score = max(0, 100 - filler_density * 200)

        # Combine: 60% WPM, 40% filler
        clarity = (wpm_score * 0.6) + (filler_score * 0.4)
        return round(clarity, 2)

    def _analyze_sentiment(self, transcript: str) -> float:
        """Analyze sentiment using VADER."""
        if not transcript:
            return 50.0  # Neutral

        scores = self.sentiment_analyzer.polarity_scores(transcript)
        # Convert compound score (-1 to 1) to 0-100
        sentiment = ((scores['compound'] + 1) / 2) * 100
        return round(sentiment, 2)

    def _analyze_emotion(self, transcript: str):
        """ML-based emotion detection using transformer model.
        Replaces DeepFace (video-based) with NLP-based approach.
        """

        if not transcript:
            return {
                "primary_emotion": "neutral",
                "emotion_scores": {},
                "confidence_from_emotion": 70
            }

        try:
            results = self.emotion_model(transcript[:512])[0]

            # Convert to dictionary
            scores = {r['label']: round(r['score'] * 100, 2) for r in results}

            # Get top emotion
            primary_emotion = max(scores, key=scores.get)

            # Map emotion → confidence score
            emotion_conf_map = {
                "joy": 90,
                "neutral": 70,
                "anger": 40,
                "fear": 45,
                "sadness": 50,
                "surprise": 75,
                "disgust": 35
            }

            confidence = emotion_conf_map.get(primary_emotion.lower(), 60)

            return {
                "primary_emotion": primary_emotion,
                "emotion_scores": scores,
                "confidence_from_emotion": confidence
            }

        except Exception as e:
            print(f"Emotion analysis failed: {e}")

            return {
                "primary_emotion": "neutral",
                "emotion_scores": {},
                "confidence_from_emotion": 70
            }

    def _calculate_confidence(self, clarity: float, sentiment: float, emotion_confidence: float) -> float:
        """Calculate overall confidence score."""
        # Weights: clarity 40%, sentiment 30%, emotion 30%
        confidence = (clarity * 0.4) + (sentiment * 0.3) + (emotion_confidence * 0.3)
        return round(confidence, 2)

    def _llm_analysis(self, transcript: str) -> Optional[Dict[str, Any]]:
        """Bonus: LLM-based analysis using OpenAI."""
        if not self.openai_client or not transcript:
            return None

        try:
            prompt = f"""
You are an AI hiring assistant evaluating a candidate for a software engineering role.

Analyze the interview transcript and return a structured evaluation.

Give the output in JSON format ONLY with the following fields:

- communication_score (0-100)
- confidence_score (0-100)
- technical_understanding (0-100)
- strengths (list of 3-5 points)
- weaknesses (list of 2-4 points)
- recommendation (Select / Hold / Reject)
- reasoning (short explanation)

Evaluation Guidelines:
- Communication: clarity, articulation, fluency
- Confidence: certainty, assertiveness, tone
- Technical understanding: depth of knowledge, correctness
- Penalize vague or generic answers
- Reward structured and clear explanations

Transcript:
{transcript[:1500]}
"""
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3
            )

            # Parse JSON response
            import json

            content = response.choices[0].message.content.strip()

            # Remove markdown if present
            if content.startswith("```"):
                content = content.split("```")[1]

            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = {"error": "Invalid JSON from LLM", "raw": content}

            return data

        except Exception as e:
            print(f"LLM analysis failed: {e}")
            return None

    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """Main analysis function."""
        if not os.path.exists(video_path):
            return {"error": "Video file not found"}

        # Get video duration
        try:
            video = VideoFileClip(video_path)
            duration = video.duration
            video.close()
        except Exception as e:
            return {"error": f"Failed to load video: {str(e)}"}

        if duration < 10:
            return {"error": "Video too short (minimum 10 seconds required)"}

        # Extract audio
        audio_path = video_path.replace('.mp4', '.wav').replace('.avi', '.wav')
        if not self._extract_audio(video_path, audio_path):
            return {"error": "Failed to extract audio from video"}

        # Transcribe
        transcript = self._transcribe_audio(audio_path)
        if not transcript:
            os.remove(audio_path)  # Cleanup
            return {"error": "Failed to transcribe audio"}

        # Analyze components
        clarity = self._analyze_clarity(transcript, duration)
        sentiment = self._analyze_sentiment(transcript)
        emotion_data = self._analyze_emotion(transcript)

        # Bonus LLM analysis
        llm_feedback = self._llm_analysis(transcript)

        # Calculate confidence with LLM integration if available
        if llm_feedback and isinstance(llm_feedback, dict):

            llm_confidence = llm_feedback.get("confidence_score")

            # Validate LLM score
            if isinstance(llm_confidence, (int, float)) and 0 <= llm_confidence <= 100:
                calculated_confidence = self._calculate_confidence(
                    clarity,
                    sentiment,
                    emotion_data['confidence_from_emotion']
                )

                # Balanced blend (safer than 70/30)
                confidence = round((llm_confidence * 0.6) + (calculated_confidence * 0.4), 2)
            else:
                # fallback if LLM output invalid
                confidence = self._calculate_confidence(
                    clarity,
                    sentiment,
                    emotion_data['confidence_from_emotion']
                )
        else:
            confidence = self._calculate_confidence(
                clarity,
                sentiment,
                emotion_data['confidence_from_emotion']
            )
        # Cleanup
        if os.path.exists(audio_path):
            os.remove(audio_path)

        result = {
            "transcript": transcript,
            "clarity": clarity,
            "sentiment": sentiment,
            "confidence": confidence,
            "primary_emotion": emotion_data['primary_emotion'],
            "emotion_scores": emotion_data['emotion_scores']
        }

        if llm_feedback:
            result["llm_analysis"] = llm_feedback

        return result

video_engine = VideoEngine()
