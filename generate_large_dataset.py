import pandas as pd
import numpy as np

def generate_large_dataset(n_rows=5000):
    np.random.seed(42)
    
    races = ['White', 'Black', 'Hispanic', 'Asian', 'Other']
    race_probs = [0.6, 0.15, 0.15, 0.07, 0.03]
    
    data = {
        'income': np.random.normal(60000, 20000, n_rows).clip(20000, 250000),
        'credit_score': np.random.normal(680, 70, n_rows).clip(300, 850),
        'debt_to_income': np.random.uniform(0.1, 0.6, n_rows),
        'employment_years': np.random.randint(0, 40, n_rows),
        'age': np.random.normal(40, 12, n_rows).clip(18, 90).astype(int),
        'zip_code': np.random.randint(10000, 99999, n_rows),
        'race': np.random.choice(races, size=n_rows, p=race_probs)
    }
    
    df = pd.DataFrame(data)
    
    # Simple logic for loan approval with injected bias
    # Higher income and higher credit score increase approval probability
    # Injecting lower approval base rate for 'Black' and 'Hispanic' groups for bias testing
    
    def calculate_approval(row):
        score = (row['income'] / 10000) * 0.4 + (row['credit_score'] / 100) * 0.6
        if row['race'] in ['Black', 'Hispanic']:
            score -= 1.5  # Injected bias factor
            
        prob = 1 / (1 + np.exp(-(score - 8)))  # Sigmoid centered around 8
        return 1 if np.random.random() < prob else 0

    df['loan_approved'] = df.apply(calculate_approval, axis=1)
    
    output_path = 'large_sample_dataset.csv'
    df.to_csv(output_path, index=False)
    print(f"Dataset with {n_rows} rows generated at {output_path}")

if __name__ == "__main__":
    generate_large_dataset(5000)
