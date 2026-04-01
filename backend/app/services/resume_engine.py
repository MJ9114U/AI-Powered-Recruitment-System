import re
from typing import Dict, List, Any
import pypdf
import spacy
from collections import Counter

class ResumeEngine:
    def __init__(self):
        try:
            # Load small English model (requires: python -m spacy download en_core_web_sm)
            self.nlp = spacy.load("en_core_web_sm")
        except:
            # Fallback to None if not pre-downloaded, will skip NER parts
            self.nlp = None

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    def analyze_resume(self, file_path: str) -> Dict[str, Any]:
        text = self.extract_text_from_pdf(file_path)
        if not text:
            return {"error": "Could not extract text from resume"}

        # Basic RegEx for common profile info
        email = re.findall(r"[\w\.-]+@[\w\.-]+", text)
        phone = re.findall(r"\+?\d[\d -]{8,15}\d", text)

        # Basic Skill matching using a dictionary (extendable)
        common_skills = [
            "Python", "React", "Node", "Javascript", "FastAPI", "SQL", 
            "MongoDB", "AWS", "Docker", "Kubernetes", "AI", "ML", "DevOps",
            "Project Management", "Leadership", "Communication", "Data Analysis"
        ]
        
        extracted_skills = []
        for skill in common_skills:
            if re.search(rf"\b{skill}\b", text, re.IGNORECASE):
                extracted_skills.append(skill)

        # Basic Experience estimation (if mentions years)
        experience_match = re.search(r"(\d+)\+?\s*years?\s*of\s*experience", text, re.IGNORECASE)
        experience_years = int(experience_match.group(1)) if experience_match else 0

        # NER for Education/Orgs if spaCy is available
        entities = {"ORG": [], "EDU": []}
        if self.nlp:
            doc = self.nlp(text[:10000]) # Process first 10k chars
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    entities["ORG"].append(ent.text)
                elif ent.label_ == "FAC": # Often covers Schools/Unis
                    entities["EDU"].append(ent.text)

        return {
            "email": email[0] if email else None,
            "phone": phone[0] if phone else None,
            "skills": list(set(extracted_skills)),
            "experience_years": experience_years,
            "top_orgs": list(set(entities["ORG"]))[:5],
            "raw_text_preview": text[:500] if text else ""
        }

resume_engine = ResumeEngine()
