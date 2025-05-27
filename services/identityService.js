const { Op } = require('sequelize');
const Contact = require('../models/contact');

exports.reconcileIdentity = async (email, phoneNumber) => {
    // Step 1: Find contacts that match email or phoneNumber
    const matchedContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null
            ].filter(Boolean)
        },
        order: [['createdAt', 'ASC']]
    });

    if (matchedContacts.length === 0) {
        // No contacts matched → create new primary if either email or phoneNumber exists
        if (!email && !phoneNumber) {
            return { contact: null };
        }

        const newPrimary = await Contact.create({
            email,
            phoneNumber,
            linkPrecedence: 'primary'
        });

        return {
            contact: {
                primaryContactId: newPrimary.id,
                emails: [email].filter(Boolean),
                phoneNumbers: [phoneNumber].filter(Boolean),
                secondaryContactIds: []
            }
        };
    }

    // Step 2: Identify the true primary contact
    let truePrimary = matchedContacts.find(c => c.linkPrecedence === 'primary');

    if (!truePrimary && matchedContacts.length > 0) {
        // matched contacts are secondaries only, get their primary by linkedId
        const primaryId = matchedContacts[0].linkedId;
        truePrimary = await Contact.findOne({ where: { id: primaryId } });
    }

    // Step 3: Fetch all contacts linked to this true primary
    const relatedContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                { id: truePrimary.id },
                { linkedId: truePrimary.id }
            ]
        },
        order: [['createdAt', 'ASC']]
    });

    // Step 4: Check if new contact needed (any new info not present)
    const emailsSet = new Set(relatedContacts.map(c => c.email).filter(Boolean));
    const phonesSet = new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean));

    let needsSecondary = false;

    if (email && !emailsSet.has(email)) {
        needsSecondary = true;
    }
    if (phoneNumber && !phonesSet.has(phoneNumber)) {
        needsSecondary = true;
    }

    if (needsSecondary) {
        const newSecondary = await Contact.create({
            email,
            phoneNumber,
            linkPrecedence: 'secondary',
            linkedId: truePrimary.id
        });

        relatedContacts.push(newSecondary);
        emailsSet.add(email);
        phonesSet.add(phoneNumber);
    }

    // Step 5: Prepare response arrays without duplicates
    const emails = Array.from(emailsSet);
    const phoneNumbers = Array.from(phonesSet);
    const secondaryContactIds = relatedContacts
        .filter(c => c.linkPrecedence === 'secondary')
        .map(c => c.id);

    return {
        contact: {
            primaryContactId: truePrimary.id,
            emails,
            phoneNumbers,
            secondaryContactIds
        }
    };
};
