function indexObject(object){
  return async (req, res, next)=> {
    try {
    const obj = await object.findAll();
    res.send(obj.map(o=>o.toJSON()));
    } catch(e) {
      next(e);
    }
  }
}

function getById(object) {
  return async (req, res, next)=> {
    try {
    const id = req.params.id;
    const obj = await object.findById(id);
    res.send(o.toJSON());
    } catch(e) {
      next(e);
    }
  }
}

function updateByParam(object, props) {
  return async (req, res, next)=> {
    try {
    let key = Object.keys(params)[0];
    const obj = await object.update(props,{ where: { [key]: params[key] } });
    res.send(o.toJSON());
    } catch(e) {
      next(e);
    }
  }
}

function updateById(object, props) {
  return async (req, res, next)=> {
    try {
    const id = req.params.id;
    const obj = await object.update(props,{ where: { id } });
    res.send(o.toJSON());
    } catch(e) {
      next(e);
    }
  }
}
module.exports = { indexObject, getById, updateById, updateByParam }
