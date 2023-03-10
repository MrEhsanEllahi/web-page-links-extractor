const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
//cheerio will be used to parse the response of html after call
const cheerio = require('cheerio');
// validator for url validation
const validator = require('validator');

const app = express();

//use body-parser as a middleware
app.use(bodyParser.urlencoded({
    extended: false
}));

//set ejs as a template engine
app.set('view engine', 'ejs');

//show the index view when app starts
app.get('/', function (req, res) {
    res.render('index');
});

app.post('/extract-links', (req, res) => {
    let url = req.body.url;

    //if not a valid url, return an error
    if (!isValidUrl(url)) {
        res.status(500).send('Invalid URL');
    }

    //remove the trailing slash in order to use url later for viewing 
    url = url.endsWith('/') ? url.substring(0, url.length - 1) : url;

    extractUrls(url, linksList => {
        //callback will be false in case of any error
        if (!linksList) {
            res.status(500).send('Something went wrong!');
        } else {
            //show user the list as clickable links
            res.render('index', {
                url: url,
                links: linksList
            });
        }
    });
});

//make call to extract all urls from the given url
async function extractUrls(url, callback) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const hrefs = $("a");
        const hrefs_data = [];
        if (hrefs.length > 0) {
            hrefs.each(function () {
                href = $(this).attr('href');
                if (typeof href == 'undefined' || href == '') {
                    return;
                }
                href = href.trim();
                //in case href doesn't include webiste url but just a target, for example: "/new-page"
                if (!isValidUrl(href)) {
                    var href = url + '/' + href.substr(href.indexOf('/') + 1);
                }
                //add the link to a list only if its a valid url and not ends with #
                if(isValidUrl(href) && !href.endsWith('#')) {
                    hrefs_data.push({
                        href
                    });
                }
            });
        }
        callback(hrefs_data);
    } catch (error) {
        callback(false);
    }
}

//validate input if that is a valid URL
function isValidUrl(string) {
    return validator.isURL(string);
}

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});