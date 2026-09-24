"""
Unit and integration tests for Biometric Face Recognition system.
"""
import io
import base64
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from app.main import app
from app.services.face_recognition_service import FaceRecognitionService

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    yield
    from scripts.clean_fake_data import clean_database
    clean_database()

def create_synthetic_face(seed_eye_offset=0):
    img = Image.new("RGB", (160, 160), (225, 195, 175))
    d = ImageDraw.Draw(img)
    d.ellipse([20, 20, 140, 140], fill=(210, 175, 155))
    d.ellipse([45 + seed_eye_offset, 60, 65 + seed_eye_offset, 75], fill=(30, 30, 30))
    d.ellipse([95 + seed_eye_offset, 60, 115 + seed_eye_offset, 75], fill=(30, 30, 30))
    d.line([80, 75, 80, 95], fill=(120, 80, 60), width=3)
    d.arc([55, 95, 105, 120], 0, 180, fill=(180, 50, 50), width=4)
    return img

def image_to_base64(pil_img):
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def test_face_recognition_service_embedding():
    face1 = create_synthetic_face(0)
    norm_img, emb1, thumb = FaceRecognitionService.process_face_image(face1)
    
    assert len(emb1) == 352
    assert thumb.startswith("data:image/jpeg;base64,")
    
    # Self-similarity should be 1.0
    sim_self = FaceRecognitionService.cosine_similarity(emb1, emb1)
    assert pytest.approx(sim_self, 0.01) == 1.0

def test_face_elements_detection():
    face1 = create_synthetic_face(0)
    diag = FaceRecognitionService.detect_elements(face1)
    assert diag["detected"] is True
    assert diag["landmarks"] is not None
    assert diag["elements"]["left_eye"] is True
    assert diag["elements"]["right_eye"] is True
    assert diag["elements"]["nose"] is True
    assert diag["elements"]["mouth"] is True

def test_face_recognition_service_discrimination():
    face1 = create_synthetic_face(0)
    face1_variant = create_synthetic_face(1)
    
    # High-contrast geometric square image (different persona)
    other = Image.new("RGB", (160, 160), (20, 40, 80))
    d = ImageDraw.Draw(other)
    d.rectangle([10, 10, 150, 150], fill=(220, 240, 255))
    d.line([0, 0, 160, 160], fill=(0, 0, 0), width=8)

    _, emb1, _ = FaceRecognitionService.process_face_image(face1)
    _, emb1_v, _ = FaceRecognitionService.process_face_image(face1_variant)
    _, emb_other, _ = FaceRecognitionService.process_face_image(other)

    sim_same = FaceRecognitionService.cosine_similarity(emb1, emb1_v)
    sim_diff = FaceRecognitionService.cosine_similarity(emb1, emb_other)

    assert sim_same > 0.85
    assert sim_diff < 0.70

def test_api_face_login_flow():
    import uuid
    face_img = create_synthetic_face(0)
    b64_img = image_to_base64(face_img)

    unique_email = f"driver_{uuid.uuid4().hex[:8]}@testfacelogin.com"
    reg_payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Face Login Test User",
        "role": "driver",
        "face_image": b64_img
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200

    # Face login with the same face should succeed with 200
    res = client.post("/api/auth/face-login", json={"face_image": b64_img, "role_hint": "driver", "email_hint": unique_email})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["email"] == unique_email
    assert data["face_enrolled"] is True

def test_api_registration_with_face():
    face_img = create_synthetic_face(2)
    b64_img = image_to_base64(face_img)

    import uuid
    unique_email = f"driver_{uuid.uuid4().hex[:8]}@testbiometrics.com"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Biometric Test Driver",
        "role": "driver",
        "phone": "+91 98888 77777",
        "city": "Bengaluru",
        "platform": "Ola & Uber",
        "vehicle_type": "Sedan",
        "face_image": b64_img
    }

    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == unique_email
    assert data["face_enrolled"] is True
    assert data["avatar_url"] is not None
