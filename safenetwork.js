/***************** ADD NEW POST *****************/

$(document).ready(function () {
    $('button.addPost').click(function () {
        var postTitle = $('.title').val();
        var postBody = $('.body').val();
        let key = Math.random().toString(36).replace(/[^a-z]+/g, '');
        insertItem(key, {
            title: postTitle,
            body: postBody
        });
        $('.posts').html("");
        $('.title').val("");
        $('.body').val("");
    });

    /***************** UPDATE POST *****************/

    $(document.body).on('click', 'button.updatePost', function () {
        var html = $(this).html(); // check if the button text is EDIT or SAVE
        var body = $(this).prev(); // get the input box that you want to edit
        var title = body.prev().html();
        var updateKey = $(this).attr('title'); // the button title is used to store the post ID
        if (html === 'EDIT') {
            $(this).html('SAVE');
            body.attr('contenteditable', 'true');
            body.css({
                background: "#fdffab"
            });
        } else if (html === 'SAVE') {
            var newBody = body.html();
            var update = {
                title: title,
                body: newBody
            }
            $('.posts').html("");
            updateItem(updateKey, update, 0);
        }
    });

    /***************** DELETE POST *****************/

    $(document.body).on('click', 'button.deletePost', function () {
        var deleteKey = $(this).attr('title');
        deleteItems(deleteKey);
        $('.posts').html("");
    });
});

/***************** INITIALIZE APP *****************/

authoriseAndConnect();

let safeApp;
async function authoriseAndConnect() {
    let appInfo = {
        name: 'Simple CRUD Demo',
        id: 'net.maidsafe.tutorials.web-app',
        version: '1.0.0',
        vendor: 'MaidSafe.net Ltd.'
    };
    safeApp = await window.safe.initialiseApp(appInfo);
    console.log('Authorising SAFE application...');
    const authReqUri = await safeApp.auth.genAuthUri();
    const authUri = await window.safe.authorise(authReqUri);
    console.log('SAFE application authorised by user');
    await safeApp.auth.loginFromUri(authUri);
    console.log("Application connected to the network");
    createMutableData();
};

/***************** CREATE FIRST POST *****************/

let md;
async function createMutableData() {
    console.log("Creating MutableData with initial dataset...");
    const typeTag = 15000;
    md = await safeApp.mutableData.newRandomPublic(typeTag);
    const initialData = {
        "random_key_1": JSON.stringify({
            title: "This is a DEMO CRUD app",
            body: "And it uses the SAFE API"
        })
    };
    await md.quickSetup(initialData);
    displayPosts();
}

/***************** INSERT NEW ITEM *****************/

async function insertItem(key, value) {
    const mutations = await safeApp.mutableData.newMutation();
    await mutations.insert(key, JSON.stringify(value));
    await md.applyEntriesMutation(mutations);
    displayPosts();
};

/***************** GET ITEMS *****************/

async function getItems() {
    const entries = await md.getEntries();
    const entriesList = await entries.listEntries();
    const items = [];
    entriesList.forEach((entry) => {
        const value = entry.value;
        if (value.buf.length == 0) return;
        const parsedValue = JSON.parse(value.buf);
        items.push({
            key: entry.key,
            value: parsedValue,
            version: value.version
        });
    });
    return items;
};

/***************** DISPLAY POSTS *****************/

async function displayPosts() {
    try {
        const url = await window.currentWebId["#me"]["@id"];
        const img = await window.currentWebId["#me"]["image"]["@id"];
        const name = await window.currentWebId["#me"]["name"];
        let items = [];
        items = await getItems();
        if (items.length == 0) {
            $('.posts').html("There are no posts to show");
        } else {
            items.forEach(async(item) => {
                let newPost = `<div class="post"><h2><img src="${img}" class="user-image-small" /><a href="${url}">${name}</a></h2><h3>${item.value.title}</h3><div class="postBody">${item.value.body}</div><button title="${item.key}" class="btn btn-red updatePost">EDIT</button>&nbsp;<button title="${item.key}" class="btn btn-blue deletePost">DELETE</button></div>`;
                $('.posts').prepend(newPost);
            });
        }
    } catch (err) {
        alert(err.message + ". Please make sure you have enabled experimental API and selected your webID.");
    }
};

/***************** UPDATE POST *****************/

async function updateItem(key, value, version) {
    const mutations = await safeApp.mutableData.newMutation();
    await mutations.update(key, JSON.stringify(value), version + 1);
    await md.applyEntriesMutation(mutations);
    displayPosts();
};

/***************** DELETE POST *****************/

async function deleteItems(keyToRemove) {
    let items = [];
    items = await getItems();
    const mutations = await safeApp.mutableData.newMutation();
    items.forEach(async(item) => {
        if (item.key == keyToRemove) {
            await mutations.delete(item.key, item.version + 1);
        }
    });
    await md.applyEntriesMutation(mutations);
    displayPosts();
};
