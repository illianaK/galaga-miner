const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
// Connect this to your personal hosted or cloud LNbits wallet engine instance
const LNBITS_API_URL = "https://lnbits.com"; 
const LNBITS_INVOICE_KEY = "YOUR_LNBITS_ADMIN_OR_INVOICE_KEY"; // Protect this key safely

app.post('/api/payout', async (req, res) => {
    const { address, amount } = req.body;

    if (!address || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid transaction payload parameters." });
    }

    // Safety Parameter: Set a hard limit on max single payouts to guard against client tampering
    if (amount > 100) {
        return res.status(400).json({ success: false, message: "Payout tier exceeds server safe authorization limits." });
    }

    try {
        console.log(`[PAYOUT INITIATED] Outbound Routing: ${amount} Satoshis to endpoint [${address}]`);

        // Fires a secure backend transaction command to dispense real funds via the Lightning Network
        const lnbitsResponse = await fetch(`${LNBITS_API_URL}/api/v1/payments`, {
            method: 'POST',
            headers: {
                'X-Api-Key': LNBITS_INVOICE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                out: true,          // Marks transactional direction as an outbound payout withdrawal
                bolt11: address,     // System target address payload handler
                amount: amount
            })
        });

        const paymentResult = await lnbitsResponse.json();

        if (lnbitsResponse.ok) {
            return res.json({ success: true, checking_id: paymentResult.checking_id });
        } else {
            return res.status(500).json({ success: false, message: paymentResult.detail || "Network transaction failure." });
        }

    } catch (err) {
        console.error("[CRITICAL NODE SYSTEM FAILURE]:", err);
        return res.status(500).json({ success: false, message: "Internal lightning node system timeout." });
    }
});

app.listen(PORT, () => console.log(`[BACKEND RUNNING] P2E Crypto Arcade Controller active on port ${PORT}`));
