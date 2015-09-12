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

.import "./storage.js" as StorageJS

var posts = [];
var allPosts = [];
var countToLoad = 0;
var countLoaded = 0;
var requestsToExecute = 10;
var n;
var onStored;
var page = 'flymerwall';

function getCount() {
    var url = 'https://api.vk.com/method/widgets.getComments'
            + '?widget_api_id=3206293'
            + '&page_id=' + page
            + '&order=date'
            + '&fields=first_name,last_name,photo_100,domain'
            + '&count=200'
            + commonParametres();
    apiRequest(url, function(resp) {
        if (resp.hasOwnProperty('response')) {
            console.debug('got count ' + resp.response.count);
            countToLoad = resp.response.count - 200 - StorageJS.getPostsCount(page);
            posts[0] = resp.response.posts;
            countLoaded = posts[0].length;
        }
        else
            console.debug(resp.error.error_code + ': ' + resp.error.error_msg);
        getAllPosts();
    });
}

function getAllPosts(loadpage, fun) {
    if (loadpage !== undefined) {
        n = -1;
        allPosts = [];
        posts = [];
        onStored = fun;
        page = loadpage;
        getCount(getAllPosts);
    } else {
        if (countToLoad === 0 && onStored !== undefined) {
            onStored();
            return;
        }
        if (allPosts.length > 0) {
            var lastCountLoaded = 0;
        //console.log(posts.length);
            for (var i = 0; i < posts.length; i++)
                //if (posts[i] !== null)
                lastCountLoaded += posts[i].length;
            if (lastCountLoaded === requestsToExecute * 200 || lastCountLoaded > countToLoad - countLoaded - 200)
                countLoaded += lastCountLoaded;
            else
                n--;
        }
        n += 1;
        console.log('got ' + countLoaded + ' posts');
        allPosts = allPosts.concat(posts);
        //console.log('get whole wall');
        if (countToLoad > 0 && n < countToLoad / 200 / requestsToExecute) {
            //sleep
            execute();
        }
        else {
            StorageJS.storePosts(allPosts, page);
            if (onStored !== undefined)
                onStored();
        }
    }
}

function execute() {
    //console.log('getting posts from ' + (n*2000+201) + ' to ' + (n*2000+2200));
    var script = 'var i = ' + ((n+1) * requestsToExecute) + ';\n'
            + 'var posts = [];\n'
            + 'while (i >= ' + (n * requestsToExecute+1) + ') {\n'
                + 'var wall = API.widgets.getComments({\n'
                    + '"widget_api_id": 3206293,\n'
                    + '"page_id": "' + page + '",\n'
                    + '"order": "date",\n'
                    + '"fields": "first_name,last_name,photo_100,domain",\n'
                    + '"count": 200,\n'
                    + '"offset": 200*i,\n'
                    + '"v": 5.29,\n'
                    + '"access_token": "' + StorageJS.readSettingsValue('access_token') + '"\n'
                + '});\n'
                + 'posts.push(wall.posts);\n'
                + 'i = i - 1;\n'
            + '}\n'
            + 'return posts;'
    //console.log(script);
    var url = 'https://api.vk.com/method/execute?code=' + script
            + commonParametres();
    apiRequest(url, function(resp) {
        if (resp.hasOwnProperty('response')) {
            //console.debug(wall.response.count);
            posts = resp.response;
        }
        else {
            console.debug(resp.error.error_code + ': ' + resp.error.error_msg);
            if (resp.error.error_code === 0) {
                execute();
                return;
            }
        }
        getAllPosts();
    });
}

var postID, userID;
function likePost(user, post, like) {
    postID = post;
    userID = user;
    if (like === undefined)
        like = true;
    var url = 'https://api.vk.com/method/likes.' + (like ? 'add' : 'delete')
            + '?type=post'
            + '&owner_id=' + user
            + '&item_id=' + post
            + commonParametres();
    apiRequest(url, onLike);
}

function onLike(resp) {
    if (resp.hasOwnProperty('response')) {
        var likes = resp.response.likes;
        console.debug('post now has ' + likes + ' likes');
        StorageJS.setPostLikes(page, userID, postID, likes);
    }
    else
        console.debug(resp.error.error_code + ': ' + resp.error.error_msg);
}

function commonParametres() {
    return '&v=5.29&access_token=' + StorageJS.readSettingsValue('access_token');
}

function apiRequest(url, onSuccess) {
    //console.log(url);
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        // Need to wait for the DONE state or you'll get errors
        if (request.readyState === request.DONE) {
            if (request.status === 200) {
                onSuccess(JSON.parse(request.responseText));
            }
            else {
                // This is very handy for finding out why your web service won't talk to you
                console.debug("Status: " + request.status + ", Status Text: " + request.statusText);
                if (request.status === 0)
                    apiRequest(url, onSuccess);
            }
        }
    }
    request.open("GET", url, true); // only async supported
    request.send();
}
