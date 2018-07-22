const { GenJobObj } = require('./_JobsBase');

module.exports = {
  ...GenJobObj,
  Methods: {
    ...GenJobObj.Methods,
    async denormalize(){ } //do nothing :)
  },
  StaticMethods: {
    ...GenJobObj.StaticMethods,
    new({ to, from, msg, subject }) {
      return this.sequelize.models.SendEmailJob.create({
        data: { to, from, msg: body, subject }
      });
    }
  },
  Name: 'SendEmailJob'
};

