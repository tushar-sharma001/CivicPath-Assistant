// Security: Basic input sanitization to prevent XSS
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('animate-slide-up');
    });

    document.querySelectorAll('aside button').forEach(b => b.classList.remove('step-active'));

    const target = document.getElementById(id);
    target.classList.remove('hidden');

    setTimeout(() => { target.classList.add('animate-slide-up'); }, 10);

    document.getElementById('btn-' + id).classList.add('step-active');
}

// ⚠️ WARNING: DO NOT commit this file to GitHub with your real API key!
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function askAssistant() {
    const inputField = document.getElementById('user-input');

    // SECURITY UPDATE: Sanitize the raw input right when we grab it
    const userText = sanitizeInput(inputField.value.trim());
    const chatBox = document.getElementById('chat-box');

    if (!userText) return;

    chatBox.innerHTML += `
        <div class="flex items-start gap-4 flex-row-reverse animate-slide-up">
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 shadow-sm">
                <i class="ph-fill ph-user text-slate-300 text-sm"></i>
            </div>
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md leading-relaxed text-sm">
                ${userText}
            </div>
        </div>
    `;
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    await sleep(400);

    const loadingId = 'loading-' + Date.now();
    chatBox.innerHTML += `
        <div id="${loadingId}" class="flex items-start gap-4 animate-slide-up">
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <i class="ph-fill ph-robot text-indigo-400 text-sm"></i>
            </div>
            <div class="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center h-[48px]">
                <div class="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
            </div>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // UPDATED: Now dynamically using the GEMINI_API_KEY variable cleanly
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${'GEMINI_API_KEY'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: {
                        text: "You are CivicPath, a helpful, friendly, and expert Indian election assistant. Keep your answers brief, factual, highly professional, and easy to understand. Speak conversationally like a human guide. Format with emojis if helpful."
                    }
                },
                contents: [{
                    role: "user",
                    parts: [{
                        text: userText
                    }]
                }]
            })
        });

        const data = await response.json();

        await sleep(600);
        document.getElementById(loadingId).remove();

        if (data.error) {
            console.error("Google API Error:", data.error);
            chatBox.innerHTML += `
            <div class="flex items-start gap-4 animate-slide-up">
                <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                    <i class="ph-bold ph-warning text-red-400 text-sm"></i>
                </div>
                <div class="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm text-sm">
                    <strong>API Error:</strong> ${data.error.message}
                </div>
            </div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        let aiText = "I'm sorry, I encountered a slight hiccup processing that. Could you ask again?";
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            aiText = data.candidates[0].content.parts[0].text;
        }

        aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');

        chatBox.innerHTML += `
            <div class="flex items-start gap-4 animate-slide-up">
                <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                    <i class="ph-fill ph-robot text-indigo-400 text-sm"></i>
                </div>
                <div class="bg-white/5 border border-indigo-500/20 text-slate-200 p-4 rounded-2xl rounded-tl-sm max-w-[85%] shadow-lg leading-relaxed text-sm">
                    ${aiText.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        document.getElementById(loadingId).remove();
        console.error("Network Exception:", error);
        chatBox.innerHTML += `
            <div class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                    <i class="ph-bold ph-warning text-red-400 text-sm"></i>
                </div>
                <div class="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm text-sm">
                    Network Error: It looks like I couldn't reach the server. Please check your internet connection or browser security settings.
                </div>
            </div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') askAssistant();
});