const identityService = require('../services/identityService');

exports.identifyUser = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Email or phoneNumber is required.' });
        }

        const result = await identityService.reconcileIdentity(email, phoneNumber);
        return res.status(200).json({ contact: result });

    } catch (error) {
        console.error('Error in identifyUser:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};