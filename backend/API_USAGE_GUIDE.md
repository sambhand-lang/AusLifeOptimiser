# API Usage Guide - SSC-Based Endpoints

## Quick Start

### Get Suburb Details by SSC

```bash
curl http://localhost:3000/api/v2/suburbs/10001/details
```

**Response**:
```json
{
  "ssc": "10001",
  "suburb_name": "AARONS PASS",
  "state": "NSW",
  "primaryPostcode": "2850",
  "allPostcodes": ["2850"],
  "realTimeData": {
    "population": {
      "value": 547,
      "source": "ABS Census (Population estimate)",
      "datasetYear": 2021,
      "type": "official_dataset"
    },
    "medianAge": { ... },
    "householdSize": { ... },
    "employmentRate": { ... },
    "medianIncome": { ... },
    "commute": { ... },
    "schools": { ... },
    "publicTransportStops": { ... },
    "parks": { ... }
  }
}
```

---

## Endpoint Reference

### 1. Get Suburb Details by SSC (Primary)

**Endpoint**: `GET /api/v2/suburbs/{ssc}/details`

**Parameters**:
- `{ssc}` *(path, required)* — 5-digit SSC code (e.g., `10001`)

**Response Codes**:
- `200` — Success
- `400` — Invalid SSC format
- `404` — SSC not found
- `500` — Server error

**Example**:
```bash
curl http://localhost:3000/api/v2/suburbs/10001/details
curl http://localhost:3000/api/v2/suburbs/51487/details  # Different SSC
```

---

### 2. Resolve Suburb Name to SSC (Backward Compatibility)

**Endpoint**: `GET /api/v2/suburbs/lookup/by-name`

**Query Parameters**:
- `name` *(required)* — Suburb name (e.g., `Sydney`)
- `state` *(required)* — State code (NSW, VIC, QLD, SA, WA, TAS, ACT, NT)

**Response**:
```json
{
  "ssc": "10001",
  "suburb_name": "SYDNEY",
  "state": "NSW"
}
```

**Example**:
```bash
curl "http://localhost:3000/api/v2/suburbs/lookup/by-name?name=Sydney&state=NSW"
curl "http://localhost:3000/api/v2/suburbs/lookup/by-name?name=Melbourne&state=VIC"
```

---

### 3. Get All Postcodes for an SSC

**Endpoint**: `GET /api/v2/suburbs/{ssc}/postcodes`

**Parameters**:
- `{ssc}` *(path, required)* — 5-digit SSC code

**Response**:
```json
{
  "ssc": "10001",
  "postcodes": ["2850"]
}
```

**Use Case**: Multi-postcode suburbs will return multiple postcodes.

**Example**:
```bash
curl http://localhost:3000/api/v2/suburbs/10001/postcodes
```

---

### 4. Validate SSC (Health Check)

**Endpoint**: `POST /api/v2/suburbs/{ssc}/validate`

**Parameters**:
- `{ssc}` *(path, required)* — 5-digit SSC code

**Response** (Valid):
```json
{
  "valid": true,
  "ssc": "10001",
  "canonicalRecord": {
    "rowid": 1,
    "suburb_name": "AARONS PASS",
    "state": "NSW",
    "postcode": "2850",
    "ssc": "10001"
  }
}
```

**Response** (Invalid):
```json
{
  "valid": false,
  "ssc": "99999",
  "canonicalRecord": null
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/v2/suburbs/10001/validate
curl -X POST http://localhost:3000/api/v2/suburbs/99999/validate
```

---

## Migration Guide: Old API → V2

### Old Approach
```bash
# Old: Suburb name + state
curl "http://localhost:3000/api/suburb/Sydney/details?state=NSW"
```

### New Approach
```bash
# Step 1: Resolve name to SSC (optional, can be cached)
curl "http://localhost:3000/api/v2/suburbs/lookup/by-name?name=Sydney&state=NSW"
# Response: { "ssc": "10001", ... }

# Step 2: Fetch details using SSC
curl "http://localhost:3000/api/v2/suburbs/10001/details"
```

### Recommended Pattern
```javascript
// JavaScript/Node.js example
async function getSuburbDetails(suburbName, state) {
  // 1. Resolve to SSC
  const lookupRes = await fetch(
    `/api/v2/suburbs/lookup/by-name?name=${suburbName}&state=${state}`
  );
  const { ssc } = await lookupRes.json();
  
  // 2. Cache SSC for future use
  sessionStorage.setItem(`${suburbName}_${state}`, ssc);
  
  // 3. Fetch details
  const detailsRes = await fetch(`/api/v2/suburbs/${ssc}/details`);
  return detailsRes.json();
}

// Call
const details = await getSuburbDetails('Sydney', 'NSW');
```

---

## Error Handling

### 400 - Invalid SSC Format
```json
{
  "error": "Invalid SSC format. Expected 5-digit code."
}
```

**Solution**: Validate SSC format before sending:
```javascript
const isValidSSC = (ssc) => /^\d{5}$/.test(String(ssc));
```

### 404 - SSC Not Found
```json
{
  "error": "SSC not found in canonical registry"
}
```

**Possible Causes**:
- SSC doesn't exist in database
- Typo in SSC code
- Data hasn't been fully migrated yet

**Solution**: Use `/lookup/by-name` endpoint to resolve from known suburb name.

### 500 - Server Error
**Solution**: Check server logs and wait for retry. All requests are idempotent.

---

## Caching Strategy

### Recommended Client-Side Caching
```javascript
const sscCache = new Map();

async function getSuburbBySSC(ssc) {
  // Check cache
  if (sscCache.has(ssc)) {
    return sscCache.get(ssc);
  }
  
  // Fetch
  const res = await fetch(`/api/v2/suburbs/${ssc}/details`);
  const data = await res.json();
  
  // Cache (1 hour)
  sscCache.set(ssc, data);
  setTimeout(() => sscCache.delete(ssc), 3600000);
  
  return data;
}
```

### Server-Side Caching
- **TTL**: 1 hour per SSC
- **Strategy**: LRU (Least Recently Used)
- Bypassed on error for reliability

---

## Batch Operations

### Get Multiple Suburbs
```javascript
const sscs = ['10001', '10002', '10003'];

const details = await Promise.all(
  sscs.map(ssc => 
    fetch(`/api/v2/suburbs/${ssc}/details`).then(r => r.json())
  )
);
```

**Note**: Add delays between requests to avoid rate limiting.

---

## Common Use Cases

### 1. Display Suburb Card
```javascript
async function displaySuburbcard(ssc) {
  const data = await fetch(`/api/v2/suburbs/${ssc}/details`).then(r => r.json());
  
  console.log(`
    ${data.suburb_name}, ${data.state}
    Population: ${data.realTimeData.population.value}
    Postcode: ${data.allPostcodes.join(', ')}
  `);
}
```

### 2. Build Suburb Search
```javascript
async function searchSuburbs(query, state) {
  // First: resolve name to SSC
  const lookupRes = await fetch(
    `/api/v2/suburbs/lookup/by-name?name=${query}&state=${state}`
  );
  if (!lookupRes.ok) return null;
  
  const { ssc } = await lookupRes.json();
  
  // Then: get full details
  return fetch(`/api/v2/suburbs/${ssc}/details`).then(r => r.json());
}
```

### 3. Validate User Input
```javascript
async function validateSuburbInput(name, state, requiredMetrics = []) {
  try {
    const lookupRes = await fetch(
      `/api/v2/suburbs/lookup/by-name?name=${name}&state=${state}`
    );
    if (!lookupRes.ok) {
      return { valid: false, error: 'Suburb not found' };
    }
    
    const { ssc } = await lookupRes.json();
    
    const detailsRes = await fetch(`/api/v2/suburbs/${ssc}/details`);
    const details = await detailsRes.json();
    
    // Check required metrics exist
    for (const metric of requiredMetrics) {
      if (!details.realTimeData[metric]) {
        return { valid: false, error: `Missing metric: ${metric}` };
      }
    }
    
    return { valid: true, ssc, details };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// Usage
const result = await validateSuburbInput(
  'Sydney',
  'NSW',
  ['population', 'medianIncome']
);
```

---

## Testing

### Unit Test Example
```javascript
describe('SSC API', () => {
  it('should return suburb details for valid SSC', async () => {
    const res = await fetch('/api/v2/suburbs/10001/details');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ssc).toBe('10001');
    expect(data.suburb_name).toBeDefined();
  });

  it('should reject invalid SSC format', async () => {
    const res = await fetch('/api/v2/suburbs/invalid/details');
    expect(res.status).toBe(400);
  });

  it('should resolve suburb name to SSC', async () => {
    const res = await fetch(
      '/api/v2/suburbs/lookup/by-name?name=Sydney&state=NSW'
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ssc).toBeDefined();
  });
});
```

---

## Performance Notes

- **Cached responses**: <10ms
- **DB lookups**: ~50-100ms
- **Multi-postcode suburbs**: 1-N postcodes per SSC (all returned in single request)
- **Concurrent requests**: No hard limit; implement client-side rate limiting if needed

---

## Support

For questions or issues:
1. Check this guide first
2. Review backups in `backend/backups/`
3. Check `SSC_MIGRATION_COMPLETE.md` for data integrity info
4. Refer to [API migration checklist](#migration-guide-old-api--v2)

---

*Last Updated: 2026-02-20*
