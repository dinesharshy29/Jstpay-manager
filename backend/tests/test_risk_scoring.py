import unittest

from app.main import score_transaction


class RiskScoringTests(unittest.TestCase):
    def test_high_amount_without_contact_details_is_high_risk(self):
        score, level, factors = score_transaction(500_000, "INR", None, None)
        self.assertEqual(score, 70)
        self.assertEqual(level, "high")
        self.assertEqual(factors, ["high_amount", "missing_customer_email", "missing_customer_phone"])

    def test_normal_transaction_with_contact_details_is_low_risk(self):
        score, level, factors = score_transaction(2_500, "INR", "buyer@example.com", "+919876543210")
        self.assertEqual(score, 0)
        self.assertEqual(level, "low")
        self.assertEqual(factors, [])


if __name__ == "__main__":
    unittest.main()
