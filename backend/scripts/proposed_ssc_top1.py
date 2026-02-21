import pandas as pd

src = 'proposed_ssc_matches.csv'
dst = 'proposed_ssc_top1.csv'

df = pd.read_csv(src)
# Ensure score is numeric
df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)
# For each rowid, pick the row with highest score (if tie, first)
idx = df.groupby('rowid')['score'].idxmax()
top = df.loc[idx].copy()
# Keep columns of interest and sort
top = top[['rowid','suburb_name','state','postcode','candidate_ssc','score','matched_canonical_key']]

# Save
top.to_csv(dst, index=False)

print(f'Wrote {len(top)} top-candidate proposals to {dst}')
print(top.head(20).to_string(index=False))
