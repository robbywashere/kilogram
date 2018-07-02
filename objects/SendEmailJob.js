const { GenJobObj, JobStaticMethods } = require('./_JobsBase');

module.exports = {
  ...GenJobObj,
  StaticMethods: {
    ...JobStaticMethods,
    new({ to, from, body, subject }) {
      return this.sequelize.models.SendEmailJob.create({
        data: { to, from, message: body, subject }
      });
    }
  },
  Name: 'SendEmailJob'
};

