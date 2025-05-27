const { Op } = require('sequelize');
const Contact = require('../models/contact');

exports.reconcileIdentity = async (email, phoneNumber) => {
    // Step 1: Find contacts where email or phoneNumber matches
    const matchedContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null
            ].filter(Boolean)
        },
        order: [['createdAt', 'ASC']]
    });

    // Case 1 & 2: No match found, create a new primary contact
    if (matchedContacts.length === 0) {
        const newPrimary = await Contact.create({
            email,
            phoneNumber,
            linkPrecedence: 'primary'
        });

        return {
            contact: {
                primaryContactId: newPrimary.id,
                emails: [newPrimary.email].filter(Boolean),
                phoneNumbers: [newPrimary.phoneNumber].filter(Boolean),
                secondaryContactIds: []
            }
        };
    }

    // Case 3: One match found, but only one field matches
    if (matchedContacts.length === 1) {
        const existing = matchedContacts[0];

        const emailMatch = email && existing.email === email;
        const phoneMatch = phoneNumber && existing.phoneNumber === phoneNumber;

        const needsSecondary =
            (email && !emailMatch) || (phoneNumber && !phoneMatch);


        if (needsSecondary) {
            const newSecondary = await Contact.create({
                email,
                phoneNumber,
                linkPrecedence: 'secondary',
                linkedId: existing.id
            });

            return {
                contact: {
                    primaryContactId: existing.id,
                    emails: [existing.email, email].filter(Boolean),
                    phoneNumbers: [existing.phoneNumber, phoneNumber].filter(Boolean),
                    secondaryContactIds: [newSecondary.id]
                }
            };
        } else {
            return {
                contact: {
                    primaryContactId: existing.id,
                    emails: [existing.email].filter(Boolean),
                    phoneNumbers: [existing.phoneNumber].filter(Boolean),
                    secondaryContactIds: []
                }
            };
        }
    }

    // For these 3 cases, we shouldn't reach here
    return { contact: null };
};
