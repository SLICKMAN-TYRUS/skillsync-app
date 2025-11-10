from typing import Dict, Optional


def create_test_token(uid: str, role: str = "student") -> str:
    return f"test:{uid}:{role}"


def create_auth_header(uid: str, role: str = "student") -> Dict[str, str]:
    token = create_test_token(uid, role)
    return {"Authorization": f"Bearer {token}"}


def create_student_token(uid: str = "student1") -> str:
    return create_test_token(uid, "student")


def create_provider_token(uid: str = "provider1") -> str:
    return create_test_token(uid, "provider")


def create_admin_token(uid: str = "admin1") -> str:
    return create_test_token(uid, "admin")


def get_student_headers(uid: str = "student1") -> Dict[str, str]:
    return create_auth_header(uid, "student")


def get_provider_headers(uid: str = "provider1") -> Dict[str, str]:
    return create_auth_header(uid, "provider")


def get_admin_headers(uid: str = "admin1") -> Dict[str, str]:
    return create_auth_header(uid, "admin")


def extract_token_from_header(headers: Dict[str, str]) -> Optional[str]:
    auth_header = headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


TEST_USERS = {
    "student1": {"uid": "student1", "role": "student", "name": "Test Student 1"},
    "student2": {"uid": "student2", "role": "student", "name": "Test Student 2"},
    "provider1": {"uid": "provider1", "role": "provider", "name": "Test Provider 1"},
    "provider2": {"uid": "provider2", "role": "provider", "name": "Test Provider 2"},
    "admin1": {"uid": "admin1", "role": "admin", "name": "Test Admin 1"},
}


def get_test_user(uid: str) -> Dict:
    return TEST_USERS.get(uid, {
        "uid": uid,
        "role": "student",
        "name": f"Test User {uid}"
    })


