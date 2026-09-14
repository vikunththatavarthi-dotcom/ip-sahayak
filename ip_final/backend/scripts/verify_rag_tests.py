import sys
import json
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/chat"

def test_query(title: str, query: str, lang: str = "en", domain: str = "general"):
    print(f"\n========================================================")
    print(f"RUNNING: {title}")
    print(f"Query: {query}")
    print(f"Language: {lang} | Domain: {domain}")
    print(f"========================================================")

    payload = {
        "query": query,
        "language": lang,
        "domain": domain
    }

    try:
        r = httpx.post(BASE_URL, json=payload, timeout=180.0)
        print(f"Status Code: {r.status_code}")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        answer = data.get("answer", "")
        sources = data.get("sources", [])
        confidence = data.get("confidence", "")
        detected_lang = data.get("detected_language", "")
        actions = data.get("actions", [])

        print(f"\nDetected Language: {detected_lang}")
        print(f"Confidence: {confidence}")
        print(f"Source count: {len(sources)}")
        print("Sources:")
        for idx, s in enumerate(sources, 1):
            print(f"  {idx}. {s.get('title')} ({s.get('authority')}) [score: {s.get('relevance_score')}]")

        print(f"\nAnswer:\n{answer}")
        print(f"\nActions ({len(actions)}):")
        for a in actions:
            print(f"  Step {a.get('step')}: {a.get('description')}")

        return data
    except Exception as e:
        print(f"Error during {title}: {e}")
        raise

if __name__ == "__main__":
    print("Starting Comprehensive RAG Test Suite...")
    
    data_hi = test_query(
        "TEST A.1: Multilingual - Hindi",
        "भारत में पेटेंट की नवीनता क्या है?",
        lang="hi",
        domain="ip"
    )
    
    data_ta = test_query(
        "TEST A.2: Multilingual - Tamil",
        "இந்தியாவில் காப்புரிமை புதுமை என்றால் என்ன?",
        lang="ta",
        domain="ip"
    )
    
    data_te = test_query(
        "TEST A.3: Multilingual - Telugu",
        "భారతదేశంలో పేటెంట్ కోసం కొత్తదనం అంటే ఏమిటి?",
        lang="te",
        domain="ip"
    )

    data_b = test_query(
        "TEST B: Ayurveda + IP",
        "Can a new Ayurvedic formulation be patented in India?",
        lang="en",
        domain="ayurveda"
    )

    data_c = test_query(
        "TEST C: IP & Regulatory Knowledge Base",
        "What is the process for filing a patent in India?",
        lang="en",
        domain="ip"
    )

    data_d = test_query(
        "TEST D: Combined-Domain RAG",
        "Can I patent a new Ayurvedic formulation in India, and what factors determine whether it is patentable?",
        lang="en",
        domain="general"
    )

    print("\n\n========================================================")
    print("ALL TEST SUITES EXECUTED SUCCESSFULLY!")
    print("========================================================")
