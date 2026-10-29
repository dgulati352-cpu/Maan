"""
ShaadiSnap AI - Wedding Gallery & VIP Enrollment Utility
=========================================================
Batch-enrolls VIP subjects (Bride, Groom, Parents, Close Friends)
and wedding album photos into the active Exadel CompreFace Recognition Collection.
"""

import os
import sys
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

from src.compreface_client import CompreFaceClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("enroll_wedding")


# Default VIP wedding subjects to pre-enroll
DEFAULT_WEDDING_SUBJECTS = [
    "Bride (Simran)",
    "Groom (Karan)",
    "Bride Father",
    "Bride Mother",
    "Groom Father",
    "Groom Mother",
    "Best Man",
    "Maid of Honor",
]


def setup_wedding_collection(
    subjects: Optional[List[str]] = None,
    client: Optional[CompreFaceClient] = None,
) -> Dict[str, Any]:
    """
    Initializes the wedding subjects in CompreFace.
    """
    if client is None:
        client = CompreFaceClient(
            base_url=os.getenv("COMPREFACE_URL", "http://localhost:8000"),
            api_key=os.getenv("COMPREFACE_API_KEY", ""),
        )

    health = client.check_health()
    if not health.get("connected"):
        logger.error(f"Cannot connect to CompreFace at {client.base_url}")
        return {"success": False, "error": "CompreFace offline"}

    target_subjects = subjects or DEFAULT_WEDDING_SUBJECTS
    existing = set(client.list_subjects())
    created = []

    for subj in target_subjects:
        if subj not in existing:
            ok = client.add_subject(subj)
            if ok:
                created.append(subj)
                logger.info(f"✓ Enrolled subject identity: {subj}")
        else:
            logger.info(f"• Identity already exists: {subj}")

    current_all = client.list_subjects()
    logger.info(f"Wedding face collection ready with {len(current_all)} subjects: {current_all}")
    return {
        "success": True,
        "created_count": len(created),
        "total_subjects": len(current_all),
        "subjects": current_all,
    }


if __name__ == "__main__":
    result = setup_wedding_collection()
    print("\nEnrollment Setup Summary:", result)
