var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors');
var AuthMiddeWare = require('./AuthMiddeWare');
var responseCode = require('../ResponseCode');
var async = require('async');
var mongoCrud = require('../helpers/crud');
var AdminFollowArea = require('../models/AdminFollowArea');
var _ = require('lodash');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//localhost:8898/Area
router.use(cors());

router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

function checkNestedId(areas, id) {
    var found = false;

    _.forEach(areas, function (area) {
        if (_.isEqual(area.id, id)) {
            found = true;
            return true;
        } else {
            if (_.size(area.childs) > 0) {
                var temp = checkNestedId(area.childs, id);
                if (!found) {
                    found = temp;
                }
            }
        }
    });
    return found;
}



router.post('/CheckExistId', urlencodedParser, function (req, res) {
    var id = req.body.id;
    mongoCrud.retrieve('areas', function (err, areas) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load areas error'));
        }
        else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            var found = checkNestedId(areas, id);
            responseObject.found = found ? 1 : 0;
            res.status(200).send(responseObject);

        }
    });
});

router.get('/ListAreas', function (req, res) {
    mongoCrud.retrieve('areas', { isdeleted: false }, function (err, result) {
        if (err) {
            console.log(err);
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load areas error'));
        }
        else {
            var responseObj = cf.buildResponse(responseCode.SUCCESS, 'Load areas Success');
            responseObj.data = result;
            res.status(200).send(responseObj);
        }
    });
});
function flatternAreas(areas) {
    var arr = [];
    _.forEach(areas, function (area) {
        arr.push({ id: area.id, name: area.name });
        if (_.size(area.childs) > 0) {
            var temp = flatternAreas(area.childs);
            _.forEach(temp, function (child) {
                arr.push({ id: child.id, name: child.name });
            });

        }
    });
    return arr;
}
router.get('/ListAreasNoParent', function (req, res) {
    mongoCrud.retrieve('areas', { isdeleted: false }, function (err, result) {
        if (err) {
            console.log(err);
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load areas error'));
        }
        else {
            var responseObj = cf.buildResponse(responseCode.SUCCESS, 'Load areas Success');

            responseObj.data = flatternAreas(result);
            res.status(200).send(responseObj);
        }
    });
});

router.post('/InsertParentArea', urlencodedParser, function (req, res) {
    var body = req.body;
    var id = _.toString(body.id);
    var name = body.name;

    var json = { id: id, name: name, childs: [], isdeleted: false };

    mongoCrud.create('areas', json, function (err, result) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});


function findParentLevel(areas, parentId, childId, childName, lastNode) {
    _.forEach(areas, function (area) {

        if (_.isEqual(area.id, parentId)) {
            area.childs.push({ id: childId, name: childName, childs: [], isdeleted: false });
            if (_.isEqual(lastNode, {})) {
                mongoCrud.update('areas', area, function (err, result) {
                });
            } else {
                mongoCrud.update('areas', lastNode, function (err, result) {
                });
            }
            return true;
        } else {
            if (_.size(area.childs) > 0) {
                findParentLevel(area.childs, parentId, childId, childName, area);
            }
        }
    });

}

router.post('/InsertChildArea', urlencodedParser, function (req, res) {
    var body = req.body;
    var id = _.toString(body.id);
    var name = body.name;
    var parent = body.parent;

    mongoCrud.retrieve('areas', {}, function (err, areas) {
        if (err) throw err;
        // for each object returned perform set the property foo == block.
        findParentLevel(areas, parent, id, name, {});
        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
        res.status(200).send(responseObject);
    });

});


function findParentLevelForDelete(areas, id, lastNode) {
    _.forEach(areas, function (area) {
        if (_.isEqual(area.id, id)) {
            area.isdeleted = true;
            if (_.isEqual(lastNode, {})) {
                mongoCrud.update('areas', area, function (err, result) {
                });
            } else {
                mongoCrud.update('areas', lastNode, function (err, result) {
                });
            }
            return true;
        } else {
            if (_.size(area.childs) > 0) {
                findParentLevelForDelete(area.childs, id, area);
            }
        }
    });
}

router.post('/DeleteArea', urlencodedParser, function (req, res) {

    var body = req.body;
    var id = body.id;


    mongoCrud.retrieve('areas', {}, function (err, areas) {
        if (err) throw err;
        // for each object returned perform set the property foo == block.
        findParentLevelForDelete(areas, id, {});
        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
        res.status(200).send(responseObject);
    });

});


function findParentLevelForUpdate(areas, id, name, lastNode) {
    _.forEach(areas, function (area) {
        if (_.isEqual(area.id, id)) {
            area.name = name;

            if (_.isEqual(lastNode, {})) {
                mongoCrud.update('areas', area, function (err, result) {
                });
            } else {
                mongoCrud.update('areas', lastNode, function (err, result) {
                });
            }
            return true;
        } else {
            if (_.size(area.childs) > 0) {
                findParentLevelForUpdate(area.childs, id, name, area);
            }
        }
    });
}

router.post('/UpdateArea', urlencodedParser, function (req, res) {
    var body = req.body;
    var id = body.id;
    var name = body.name;

    mongoCrud.retrieve('areas', { isdeleted: false }, function (err, areas) {
        if (err) throw err;
        // for each object returned perform set the property foo == block.
        findParentLevelForUpdate(areas, id, name, {});
        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
        res.status(200).send(responseObject);
    });
});

router.get('/GetFollowedAreaByAdminUsername/:username', function (req, res) {
    var username = req.params.username;
    AdminFollowArea.find({ userId: username }, function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            var areas = [];
            _.forEach(docs, function (doc) {
                areas.push(doc.areaId);
            });
            responseObject.data = areas;
            res.status(200).send(responseObject);
        }
    });
});

router.post('/SetFollowArea', urlencodedParser, function (req, res) {
    var body = req.body;
    var username = body.username;
    var areaId = body.areaId;
    var status = body.status;

    if (_.toInteger(status) === 0) {
        //Theo doi
        var adminFollowArea = new AdminFollowArea({
            userId: username,
            areaId: areaId
        });

        adminFollowArea.save({}, function (err) {
            if (err) {
                var responseObject = cf.buildResponse(responseCode.ERROR, err);
                res.status(200).send(responseObject);
            } else {
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                res.status(200).send(responseObject);
            }
        });
    } else {
        //Bo theo doi
        AdminFollowArea.remove({ userId: username, areaId: areaId }, function (err) {
            if (err) {
                var responseObject = cf.buildResponse(responseCode.ERROR, err);
                res.status(200).send(responseObject);
            } else {
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                res.status(200).send(responseObject);
            }
        });
    }


});

module.exports = router;