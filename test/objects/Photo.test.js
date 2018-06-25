const assert = require('assert');
const { Photo } = require('../../objects');
const minioObj = require('../../server-lib/minio/minioObject');
const DBSync = require('../../db/sync');
const { Op } = require('sequelize');

describe('Photo object', () => {
  beforeEach(() => DBSync(true));

  it.skip('should parse objectName before create', async () => {
    const photo = await Photo.create({ type: 'POST' });
    console.log(photo.toJSON());
  });
});
