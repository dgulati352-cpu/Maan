"""
Unit and Mock Integration Tests for CompreFace Client
"""
import unittest
from unittest.mock import patch, MagicMock
from src.compreface_client import CompreFaceClient


class TestCompreFaceClient(unittest.TestCase):

    def test_compreface_initialization(self):
        client = CompreFaceClient(base_url="http://localhost:8000", api_key="test_api_key_123")
        self.assertEqual(client.base_url, "http://localhost:8000")
        self.assertEqual(client.api_key, "test_api_key_123")
        self.assertEqual(client.headers, {"x-api-key": "test_api_key_123"})
        self.assertTrue(client.is_configured())

    def test_compreface_headers_without_api_key(self):
        client = CompreFaceClient(base_url="http://localhost:8000", api_key="")
        self.assertEqual(client.headers, {})
        self.assertFalse(client.is_configured())

    @patch("httpx.Client")
    def test_compreface_check_health_healthy(self, mock_client_cls):
        mock_instance = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_instance
        
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_instance.get.return_value = mock_resp

        client = CompreFaceClient(base_url="http://localhost:8000")
        health = client.check_health()
        self.assertEqual(health["status"], "ok")
        self.assertTrue(health["connected"])

    @patch("httpx.Client")
    def test_compreface_detect_faces_mock(self, mock_client_cls):
        mock_instance = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_instance

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "result": [
                {
                    "box": {"probability": 0.99, "x_min": 100, "y_min": 120, "x_max": 200, "y_max": 240},
                    "landmarks": [[120, 150], [180, 150], [150, 180], [130, 210], [170, 210]],
                    "gender": {"value": "female", "probability": 0.98},
                    "age": {"low": 24, "high": 28},
                }
            ]
        }
        mock_instance.post.return_value = mock_resp

        client = CompreFaceClient(base_url="http://localhost:8000", api_key="mock_key")
        faces = client.detect_faces(b"fake_image_bytes")
        self.assertEqual(len(faces), 1)
        self.assertEqual(faces[0]["gender"]["value"], "female")
        self.assertEqual(faces[0]["box"]["x_min"], 100)

    @patch("httpx.Client")
    def test_compreface_recognize_faces_mock(self, mock_client_cls):
        mock_instance = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_instance

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "result": [
                {
                    "box": {"probability": 0.99, "x_min": 100, "y_min": 100, "x_max": 200, "y_max": 200},
                    "subjects": [
                        {"subject": "bride_simran", "similarity": 0.94},
                        {"subject": "guest_ananya", "similarity": 0.41},
                    ],
                }
            ]
        }
        mock_instance.post.return_value = mock_resp

        client = CompreFaceClient(base_url="http://localhost:8000", api_key="mock_key")
        # Similarity threshold 0.82 should only match bride_simran
        matches = client.recognize_faces(b"fake_image_bytes", similarity_threshold=0.82)
        self.assertEqual(len(matches), 1)
        self.assertEqual(len(matches[0]["matched_subjects"]), 1)
        self.assertEqual(matches[0]["matched_subjects"][0]["subject"], "bride_simran")
        self.assertEqual(matches[0]["matched_subjects"][0]["similarity"], 0.94)

    @patch("httpx.Client")
    def test_compreface_delete_subject(self, mock_client_cls):
        mock_instance = MagicMock()
        mock_client_cls.return_value.__enter__.return_value = mock_instance

        mock_resp = MagicMock()
        mock_resp.status_code = 204
        mock_instance.delete.return_value = mock_resp

        client = CompreFaceClient(base_url="http://localhost:8000", api_key="mock_key")
        result = client.delete_subject("guest_123")
        self.assertTrue(result)


if __name__ == "__main__":
    unittest.main()
