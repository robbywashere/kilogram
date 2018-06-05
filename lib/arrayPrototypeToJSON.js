Array.prototype.toJSON = function () { return (this.length && typeof this[0] !== 'undefined' && this[0].toJSON) ? this.map(i => i.toJSON()) : this; };

