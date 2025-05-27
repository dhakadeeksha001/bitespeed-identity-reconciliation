const { Op } = require('sequelize');
const Contact = require('../models/contact');

exports.reconcileIdentity = async (email, phoneNumber) => {

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

    const primaryContacts = matchedContacts.filter(c => c.linkPrecedence === 'primary');

    let truePrimary;

    if (primaryContacts.length > 1) {

        truePrimary = primaryContacts.reduce((oldest, curr) =>
            new Date(curr.createdAt) < new Date(oldest.createdAt) ? curr : oldest
        );

        await Promise.all(
            primaryContacts.map(async (contact) => {
                if (contact.id !== truePrimary.id) {
                    contact.linkPrecedence = 'secondary';
                    contact.linkedId = truePrimary.id;
                    await contact.save();
                }
            })
        );
    } else if (primaryContacts.length === 1) {

        truePrimary = primaryContacts[0];
    } else {

        const primaryId = matchedContacts[0].linkedId;
        truePrimary = await Contact.findOne({ where: { id: primaryId } });
    }

    const relatedContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                { id: truePrimary.id },
                { linkedId: truePrimary.id }
            ]
        },
        order: [['createdAt', 'ASC']]
    });

    const exactCombinationExists = matchedContacts.some(
        c => c.email === email && c.phoneNumber === phoneNumber
    );

    const emailsSet = new Set(relatedContacts.map(c => c.email).filter(Boolean));
    const phonesSet = new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean));

    if (!exactCombinationExists) {
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
    }

    // Response
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
