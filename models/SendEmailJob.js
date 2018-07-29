const { GenJobObj } = require('./_JobsBase');

module.exports = {
  Name: 'SendEmailJob',
  ...GenJobObj,
  StaticMethods: {
    ...GenJobObj.StaticMethods,
    new({
      to, from, msg, subject,
    }) {
      return this.sequelize.models.SendEmailJob.create({
        data: {
          to, from, msg, subject,
        },
      });
    },
  },
};
