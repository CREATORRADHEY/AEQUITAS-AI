import pandas as pd
import numpy as np
import os

def generate_hiring_bias():
    """Hiring dataset with gender bias."""
    n = 2000
    rng = np.random.default_rng(42)
    
    gender = rng.choice(['Male', 'Female'], size=n)
    experience = rng.integers(0, 20, size=n)
    education = rng.choice([12, 16, 18, 20], size=n) # years
    
    # Probability of hiring: Bias against females
    # Base prob + exp + edu - penalty for female
    gender_penalty = np.where(gender == 'Female', -0.15, 0)
    hiring_prob = 0.2 + (experience / 40) + (education / 60) + gender_penalty
    hiring_prob = np.clip(hiring_prob, 0.05, 0.95)
    
    hired = rng.binomial(1, hiring_prob)
    
    df = pd.DataFrame({
        'gender': gender,
        'experience_years': experience,
        'education_years': education,
        'hired': hired
    })
    df.to_csv('hiring_bias_gender.csv', index=False)
    print("Created hiring_bias_gender.csv")

def generate_loan_bias():
    """Loan dataset with race bias (proxy via zip code)."""
    n = 3000
    rng = np.random.default_rng(7)
    
    race = rng.choice(['Group_A', 'Group_B', 'Group_C'], p=[0.6, 0.3, 0.1], size=n)
    income = rng.normal(60000, 15000, size=n)
    credit_score = rng.normal(700, 50, size=n)
    
    # Group_C has lower credit scores in this synthetic data (structural bias)
    credit_score[race == 'Group_C'] -= 40
    
    # Outcome: loan_approved
    # Bias against Group_C
    race_penalty = np.where(race == 'Group_C', -0.1, 0)
    approval_prob = (credit_score - 500) / 400 + race_penalty
    approval_prob = np.clip(approval_prob, 0.05, 0.95)
    
    loan_approved = rng.binomial(1, approval_prob)
    
    df = pd.DataFrame({
        'race': race,
        'income': income.astype(int),
        'credit_score': credit_score.astype(int),
        'loan_approved': loan_approved
    })
    df.to_csv('loan_bias_race.csv', index=False)
    print("Created loan_bias_race.csv")

if __name__ == "__main__":
    generate_hiring_bias()
    generate_loan_bias()
    print("\nTest datasets generated in project root.")
