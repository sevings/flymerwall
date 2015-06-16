/*
  Copyright (C) 2015 Vasily Khodakov
  Contact: Vasily Khodakov <binque@ya.ru>
  All rights reserved.

  This file is part of Flymer Wall.

  Flymer Wall is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Flymer Wall is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Flymer Wall.  If not, see <http://www.gnu.org/licenses/>.
*/

.import QtQuick.LocalStorage 2.0 as LS

function getDatabase() {
    return LS.LocalStorage.openDatabaseSync("flymerWall", "1", "Properties and data", 100000)
}

function initDatabase() {
    //console.log("initDatabase()");
    var db = getDatabase();
    db.transaction( function(tx) {
        //console.log("... create tables");
//        tx.executeSql("DROP TABLE settings");
//        tx.executeSql("DROP TABLE users");
//        tx.executeSql("DROP TABLE posts");
//        tx.executeSql("DROP TABLE lookingforyou");
//        tx.executeSql("DROP TABLE photo");
//        tx.executeSql("DROP TABLE video");
//        tx.executeSql("DROP TABLE audio");
//        tx.executeSql("DROP TABLE graffiti");
//        tx.executeSql("DROP TABLE links");
//        tx.executeSql("DROP TABLE docs");
        tx.executeSql("CREATE TABLE IF NOT EXISTS settings (key TEXT, value TEXT, PRIMARY KEY(key))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS users (id INTEGER, name TEXT, domain TEXT, avatar TEXT, PRIMARY KEY(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS posts (id INTEGER, user INTEGER, date TIMESTAMP, text TEXT NULL, comments SMALLINT, likes SMALLINT, reposts SMALLINT, PRIMARY KEY(id, user), FOREIGN KEY (user) REFERENCES users(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS lookingforyou (id INTEGER, user INTEGER, date TIMESTAMP, text TEXT NULL, comments SMALLINT, likes SMALLINT, reposts SMALLINT, PRIMARY KEY(id, user), FOREIGN KEY (user) REFERENCES users(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS photo (id INTEGER, post_id INTEGER, user_id INTEGER, preview TEXT, original TEXT NULL, PRIMARY KEY(id, user_id), FOREIGN KEY(user_id) REFERENCES users(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS video (id INTEGER, post_id INTEGER, user_id INTEGER, title TEXT, duration INTEGER, description TEXT NULL, preview TEXT, url TEXT, PRIMARY KEY(id, user_id), FOREIGN KEY(user_id) REFERENCES users(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS audio (id INTEGER, post_id INTEGER, user_id INTEGER, title TEXT, duration INTEGER, url TEXT, PRIMARY KEY(id, user_id), FOREIGN KEY(user_id) REFERENCES users(id))");
//        tx.executeSql("CREATE TABLE IF NOT EXISTS graffiti (id INTEGER, post_id INTEGER, user_id INTEGER, url TEXT, PRIMARY KEY(id, user_id), FOREIGN KEY(post_id) REFERENCES posts(id), FOREIGN KEY(user_id) REFERENCES users(id))");
        tx.executeSql("CREATE TABLE IF NOT EXISTS links (post_id INTEGER, user_id INTEGER, url TEXT, title TEXT NULL, descriptin TEXT NULL, image TEXT NULL, PRIMARY KEY(post_id, user_id), FOREIGN KEY(user_id) REFERENCES users(id))");
        // !descriptiOn!
        tx.executeSql("CREATE TABLE IF NOT EXISTS docs (id INTEGER, post_id INTEGER, user_id INTEGER, url TEXT, title TEXT, size INTEGER, preview TEXT NULL, PRIMARY KEY(id, user_id), FOREIGN KEY(user_id) REFERENCES users(id))");
        //pages
    })
}

function storePosts(posts, table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var db = getDatabase();
    var lastUpdate;
    db.transaction(function(tx) {
        lastUpdate = tx.executeSql('select max(date) as "last" from ' + table);
    });
    if (lastUpdate.rows.length === 1)
        storeSettingsValue(table + 'LastUpdate', lastUpdate.rows[0].last);

    db.transaction(function(tx) {
        var photo, large, stored = 0;
        //console.log("... update it")
        for (var i = 0; i < posts.length; i++) {
            for (var j = 0; j < posts[i].length; j++) {
                tx.executeSql('INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?)',
                              [posts[i][j].user.id,
                               posts[i][j].user.first_name + ' ' + posts[i][j].user.last_name,
                               posts[i][j].user.domain,
                               posts[i][j].user.photo_100]);
                tx.executeSql('INSERT OR REPLACE INTO ' + table + ' VALUES (?, ?, ?, ?, ?, ?, ?)',
                              [posts[i][j].id,
                               posts[i][j].from_id,
                               posts[i][j].date,
                               posts[i][j].text,
                               posts[i][j].comments.count,
                               posts[i][j].likes.count,
                               posts[i][j].reposts.count]);
                if (posts[i][j].hasOwnProperty('attachments')) {
                    for (var k = 0; k < posts[i][j].attachments.length; k++)
                        if (posts[i][j].attachments[k].type === 'photo') {
                            photo = '';
                            large = '';
                            if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_604'))
                                photo = posts[i][j].attachments[k].photo.photo_604;
                            else if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_130'))
                                photo = posts[i][j].attachments[k].photo.photo_130;
                            else if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_75'))
                                photo = posts[i][j].attachments[k].photo.photo_75;

                            if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_2560'))
                                large = posts[i][j].attachments[k].photo.photo_2560;
                            else if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_1280'))
                                large = posts[i][j].attachments[k].photo.photo_1280;
                            else if (posts[i][j].attachments[k].photo.hasOwnProperty('photo_807'))
                                large = posts[i][j].attachments[k].photo.photo_807;

                            tx.executeSql('INSERT OR REPLACE INTO photo VALUES (?, ?, ?, ?, ?)',
                                          [posts[i][j].attachments[k].photo.id, posts[i][j].id, posts[i][j].from_id, photo, large]);
                        }
                        else if (posts[i][j].attachments[k].type === 'audio') {
                            tx.executeSql('INSERT OR REPLACE INTO audio VALUES (?, ?, ?, ?, ?, ?)',
                                          [posts[i][j].attachments[k].audio.id,
                                           posts[i][j].id,
                                           posts[i][j].from_id,
                                           posts[i][j].attachments[k].audio.artist + ' "' + posts[i][j].attachments[k].audio.title + '"',
                                           posts[i][j].attachments[k].audio.duration,
                                           posts[i][j].attachments[k].audio.url]);
                        }
                        else if (posts[i][j].attachments[k].type === 'video') {
                            tx.executeSql('INSERT OR REPLACE INTO video VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                          [posts[i][j].attachments[k].video.id,
                                           posts[i][j].id,
                                           posts[i][j].from_id,
                                           posts[i][j].attachments[k].video.title,
                                           posts[i][j].attachments[k].video.duration,
                                           posts[i][j].attachments[k].video.description,
                                           posts[i][j].attachments[k].video.photo_320,
                                           'https://vk.com/video' + posts[i][j].attachments[k].video.owner_id + '_' + posts[i][j].attachments[k].video.id]);

                        }
                        else if (posts[i][j].attachments[k].type === 'graffiti') {
                            tx.executeSql('INSERT OR REPLACE INTO graffiti VALUES (?, ?, ?, ?)',
                                          [posts[i][j].attachments[k].graffiti.id,
                                           posts[i][j].id,
                                           posts[i][j].from_id,
                                           posts[i][j].attachments[k].graffiti.photo_586]);
                        }
                        else if (posts[i][j].attachments[k].type === 'link') {
                            tx.executeSql('INSERT OR REPLACE INTO links VALUES (?, ?, ?, ?, ?, ?)',
                                          [posts[i][j].id,
                                           posts[i][j].from_id,
                                           posts[i][j].attachments[k].link.url,
                                           posts[i][j].attachments[k].link.title,
                                           posts[i][j].attachments[k].link.description,
                                           posts[i][j].attachments[k].link.image_src]);
                        }
                        else if (posts[i][j].attachments[k].type === 'doc') {
                            tx.executeSql('INSERT OR REPLACE INTO docs VALUES (?, ?, ?, ?, ?, ?, ?)',
                                          [posts[i][j].attachments[k].doc.id,
                                           posts[i][j].id,
                                           posts[i][j].from_id,
                                           posts[i][j].attachments[k].doc.url,
                                           posts[i][j].attachments[k].doc.title,
                                           posts[i][j].attachments[k].doc.size,
                                           posts[i][j].attachments[k].doc.photo_130]);
                        }
                        else
                            console.log('attachment.type = ' + posts[i][j].attachments[k].type);

                }
            }
            stored += posts[i].length;
            console.log('stored ' + stored + ' posts');
        }
    })
    getPostsCount(table);
}

function getFairies(table) {
    var text;
    if (table === undefined || table === 'flymerwall') {
        table = 'posts';
        text = '%#_а!__тену%';
    } else
        text = '%#_!__щу!__ебя%';
    var sql = 'select users.name as "name", fairies.date as "from", users.avatar as "avatar", users.domain as "domain", fairies.cnt as "count"\n'
            + 'from users,\n'
                + '(select user as "id", count(*) as "cnt",\n'
                + 'min(datetime(date, "unixepoch", "localtime")) as "date"\n'
                + 'from ' + table + '\n'
                //+ 'where instr(text, "#на_стену") > 0 or instr(text, "#На_стену") > 0\n'
                //+ 'or instr(text, "#На_Стену") > 0 or instr(text, "#на_Стену") > 0\n'
                + 'where text like "' + text + '" escape "!"\n'
                + 'group by 1) as "fairies"\n'
            + 'where fairies.id = users.id\n'
            + 'group by name\n'
            + 'order by fairies.cnt desc, fairies.date desc\n';
    //console.log(sql);
    var db = getDatabase();
    if (!db)
        return;
    var result;
    db.transaction( function(tx) {
        //console.log("... read object")
        result = tx.executeSql(sql);
    })
    console.log('' + result.rows.length + ' fairies');
    return result.rows;
}

function getAttachments(tx, res) {
    var video, audio, photo, links, docs, sql, result = [];
    for (var i = 0; i < res.length; i++) {
        result[i] = res[i];
        //console.log(res[i].id + ' ' + res[i].user);
        sql = 'select * from video where post_id = ' + result[i].id + ' and user_id = ' + result[i].user;
        //console.log(sql);
        video = tx.executeSql(sql);
        if (video.rows.length > 0)
            result[i].video = video.rows;
        sql = 'select * from audio where post_id = ' + result[i].id + ' and user_id = ' + result[i].user;
        audio = tx.executeSql(sql);
        if (audio.rows.length > 0)
            result[i].audio = audio.rows;
        sql = 'select * from photo where post_id = ' + result[i].id + ' and user_id = ' + result[i].user;
        photo = tx.executeSql(sql);
        if (photo.rows.length > 0)
            result[i].photo = photo.rows;
        sql = 'select * from links where post_id = ' + result[i].id + ' and user_id = ' + result[i].user;
        links = tx.executeSql(sql);
        if (links.rows.length > 0)
            result[i].links = links.rows;
        sql = 'select * from docs where post_id = ' + result[i].id + ' and user_id = ' + result[i].user;
        docs = tx.executeSql(sql);
        if (docs.rows.length > 0)
            result[i].docs = docs.rows;
    }
    return result;
}

function getPosts(sql) {
    var db = getDatabase();
    if (!db)
        return;
    var result = [], res;
    db.transaction( function(tx) {
        res = tx.executeSql(sql);
        result = getAttachments(tx, res.rows);
    })
    console.log(result.length + ' posts');
    return result;
}

function getTopPosts(table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var sql = 'select * from (select users.name, users.domain, likes, comments, text, date, ' + table + '.id, user\n'
            + 'from ' + table + ', users\n'
            + 'where users.id = user\n'
            + 'order by likes desc, date desc\n'
            + 'limit 500)\n'
            + 'order by likes, date\n'
    return getPosts(sql);
}

function getWeeklyTopPosts(table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var date = (new Date() - 1000*60*60*24*7)/1000;
    var sql = 'select *\n'
            + 'from (select users.name, users.domain, likes, comments, text, date, ' + table + '.id, user\n'
            + 'from ' + table + ', users\n'
            + 'where users.id = user and date >= ' + date + ' and likes > 1\n'
            + 'order by likes desc, date desc\n'
            + 'limit 50) as "best"\n'
//            + '(select users.name, users.domain, likes, comments, text, date, ' + table + '.id, user\n'
//            + 'from ' + table + ', users\n'
//            + 'where users.id = user and date >= ' + date + ' and comments > 1\n'
//            + 'order by comments desc, date desc\n'
//            + 'limit 10) as "discussions"\n'
            + 'order by date\n'
    //console.debug(sql)
    return getPosts(sql);
}
function getFirstPosts(table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var sql = 'select users.name, users.domain, likes, comments, text, date, ' + table + '.id, user\n'
            + 'from ' + table + ', users\n'
            + 'where users.id = user\n'
            + 'order by date\n'
            + 'limit 500\n';
    return getPosts(sql);
}

function getLastPosts(table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var date = readSettingsValue(table + 'LastUpdate');
    if (date.length === 0)
        date = new Date() - 1000*60*60*24;
    var sql = 'select users.name, users.domain, likes, comments, text, date, ' + table + '.id, user\n'
            + 'from ' + table + ', users\n'
            + 'where users.id = user and date > ' + date + '\n'
            + 'order by date\n'
            + 'limit 500\n';
    //console.debug(sql)
    return getPosts(sql);
}

function getVTs() {
    var sql = 'select "Violent Daylight" as "name", "id236776651" as "domain", likes, comments, text, date, posts.id, user\n'
            + 'from posts\n'
            + 'where posts.user = 236776651\n'
            //+ 'and (instr(posts.text, "Вайлент-тайм") > 0 or instr(posts.text, "В-т") > 0\n'
            //+ 'or instr(posts.text, "Violent-time") > 0 or instr(posts.text, "V-t") > 0)\n'
            + 'and time(posts.date, "unixepoch", "localtime") > time(68400, "unixepoch")\n' //19:00+
            + 'and date(posts.date, "unixepoch", "localtime") > date(1422738000, "unixepoch")\n' //1 feb 2015+
            + 'and instr(posts.text, "#на_стену") = 0 and instr(posts.text, "#Hа_стену") = 0 and posts.comments = 0\n'
            + 'and length(posts.text) > 300\n'
            + 'order by posts.date'
    return getPosts(sql);
}

function getDrawings() {
    var sql = 'select name, domain, likes, comments, text, date, posts.id, user\n'
            + 'from posts, users,\n'
                + '(select post_id, user_id, count(*) as "count"\n'
                + 'from photo\n'
                + 'group by post_id, user_id) as "art"\n'
            + 'where users.id = posts.user and art.post_id = posts.id and art.user_id = posts.user and art.count > 0\n'
            + 'and (instr(posts.text, "рисун") > 0 or instr(posts.text, "Рисун") > 0\n'
            + 'or instr(posts.text, "росил нарис") > 0 or instr(posts.text, "росили нарис") > 0\n'
            + 'or instr(posts.text, "росила нарис") > 0)\n'
            + 'order by likes'
    return getPosts(sql);
}

function getVoices() {
    var sql = 'select name, domain, likes, comments, text, date, posts.id as "id", user\n'
            + 'from posts, users,\n'
                + '(select post_id, user_id\n'
                + 'from links\n'
                + 'where url like "%pleer.com%" or url like "%yadi.sk%"\n'
                + 'or url like "%soundcloud.com%") as "voice"\n'
            + 'where users.id = posts.user\n'
            + 'and voice.post_id = posts.id and voice.user_id = posts.user\n'
            + 'order by likes';
    return getPosts(sql);
}

function searchPosts(table, substring, name) {
    if (table === 'flymerwall')
        table = 'posts';
    var param = '';
    if (substring.length > 0)
        param += 'and instr(text, "' + substring.replace(/"/g, '""') + '") > 0\n'
    if (name.length > 0)
        param += 'and users.name like "%' + name.replace(/"/g, '""') + '%"\n'
    var sql = 'select name, domain, likes, comments, text, date, ' + table + '.id, user\n'
            + 'from ' + table + ', users\n'
            + 'where users.id = user\n' + param
            + 'order by date desc\n'
            + 'limit 500\n';
    //console.log(sql);
    return getPosts(sql);
}

function getPostsCount(table) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var sql = 'select count(*) as "count" from ' + table;
    var db = getDatabase();
    if (!db)
        return;
    var res, count;
    db.transaction( function(tx) {
        res = tx.executeSql(sql);
        count = res.rows[0].count;
    })
    console.log(count + ' posts in the database');
    return count;
}

function setPostLikes(table, user, post, likes) {
    if (table === undefined || table === 'flymerwall')
        table = 'posts';
    var sql = 'update ' + table + ' \nset likes = ' + likes + ' \nwhere user = ' + user + ' and id = ' + post;
    var db = getDatabase();
    if (!db)
        return;
    db.transaction( function(tx) {
        var res = tx.executeSql(sql);
    })
    //console.log(likes + ' likes');
}

function storeSettingsValue(key, value) {
    //console.log("storeSettingsData()")
    var db = getDatabase()
    db.transaction( function(tx) {
        //console.log("... update it")
        tx.executeSql("INSERT OR REPLACE INTO settings VALUES (\"" + key + "\", \"" + value + "\")")
    })
}

function readSettingsValue(key) {
    //console.log("readData()")
    var db = getDatabase()
    if (!db) { return }
    var value = ''
    db.transaction( function(tx) {
        //console.log("... read object")
        var result = tx.executeSql("SELECT value FROM settings WHERE key=\"" + key + "\"")
        if (result.rows.length === 1) {
            value = result.rows[0].value
        }
    })
    //console.log(value)
    return value
}
