const API_BASE = "https://areeba-abbas-incident-api.hf.space";

// Generic GET
async function get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return res.json();
}

// Generic POST
async function post(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return res.json();
}