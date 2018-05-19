const sequelize = require('sequelize');
const crypto = require('crypto');
const { ENUM, STRING, JSON, INTEGER, VIRTUAL, BOOLEAN, Op } = sequelize;
const { isLoggedIn } = require('./_helpers');

//TODO unique true composite key constraint { AccountId, username }
//




/*
 *
 * sequelize.dialect.prostgres.Q
 *
 db.dialect.QueryGenerator.
  createTrigger(
  "IGAccounts", //this.tableName,
  "IGAccounts:status:update", //triggername
  "AFTER",// eventType - default is AFTER
   ["UPDATE","status"] //fireOnSpec - default is UPDATE, columname
  "notify_event", //functionname - default is this its in the migration folder
  [{ type: "TEXT", name: "IGAccounts:status:update" }]
  )

  createTrigger(tableName, triggerName, eventType, fireOnSpec, functionName, functionParams, optionsArray) {

    const decodedEventType = this.decodeTriggerEventType(eventType);
    const eventSpec = this.expandTriggerEventSpec(fireOnSpec);
    const expandedOptions = this.expandOptions(optionsArray);
    const paramList = this.expandFunctionParamList(functionParams);

    return `CREATE ${this.triggerEventTypeIsConstraint(eventType)}TRIGGER ${triggerName}\n`
      + `\t${decodedEventType} ${eventSpec}\n`
      + `\tON ${tableName}\n`
      + `\t${expandedOptions}\n`
      + `\tEXECUTE PROCEDURE ${functionName}(${paramList});`;
  }


 db.dialect.QueryGenerator.
  createTrigger(
    "IGAccounts",
    "IGAccounts:status:update",
    "after",
     [["update","status"]],
    "notify_event",
    [{ type: "TEXT", name: "IGAccounts:status:update" }]
  )


*/

module.exports = {
  Name: 'IGAccount',
  Properties:{
    password: {
      type: STRING,
      allowNull: false,
      omit: true,
    },
    username: {
      type: STRING,
      allowNull: false,
      unique: 'igaccount_account'
      //permit: false,
    },
    status: {
      type: ENUM('UNVERIFIED','GOOD','FAILED'),
      defaultValue: 'UNVERIFIED',
      triggerable: true,
    }
  },
  Hooks: {
    afterCreate: async function({ id }) {
      const { VerifyIGJob } = this.sequelize.models;
      return VerifyIGJob.create({
        IGAccountId: id
      });
    }
  },
  Scopes: {
    verified: { where: { status: 'GOOD' } }
  },
  Methods:{
  },
  StaticMethods: {
  },
  Init(){
  },
}


