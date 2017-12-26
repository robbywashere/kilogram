const { Router } = require('express');

const { Device } = require('../objects');

const { indexObject, getById, updateById, updateByParam } = require('./helpers');

const router = Router();

router.get('/', indexObject(Device));
router.get('/:id', getById(Device));
//router.post('/enable/:id', updateById(Device, { enabled: true }))
router.post('/enabled/:adbId', updateByParam(Device, { enabled: true }))
router.post('/disabled/:adbId', updateByParam(Device, { enabled: false }))


module.exports = router;
