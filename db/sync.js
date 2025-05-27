const sequelize = require('../models');
const Contact = require('../models/contact');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');
        process.exit();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
})();