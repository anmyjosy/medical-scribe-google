
import fs from 'fs';

async function testTranslate() {
    console.log("Testing /api/translate endpoint...");
    const url = 'http://localhost:3001/api/translate';

    // Payload
    const payload = {
        text: "The patient has a severe headache and nausea.",
        targetLanguage: "Hindi"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const json = await response.json();
            console.log("Response OK:", json);
        } else {
            console.error("Response Error:", response.status, response.statusText);
            const text = await response.text();
            console.error("Body:", text);
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testTranslate();
