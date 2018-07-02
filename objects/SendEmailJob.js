const { GenJobObj } = require('./_JobsBase');

module.exports = {
  ...GenJobObj,
  Methods: {
    ...GenJobObj.Methods,
    async denormalize(){ } //do nothing :)
  },
  StaticMethods: {
    ...GenJobObj.StaticMethods,
    new({ to, from, body, subject }) {
      return this.sequelize.models.SendEmailJob.create({
        data: { to, from, message: body, subject }
      });
    }
  },
  Name: 'SendEmailJob'
};

