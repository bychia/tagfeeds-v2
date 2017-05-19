import sys
reload(sys)
sys.setdefaultencoding('UTF8')

import os
import re
from flask import Flask, Response, request, jsonify, json
try:
    from urlparse import urljoin  # Python2
    from urlparse import urlparse
except ImportError:
    from urllib.parse import urljoin  # Python3
    from urllib.parse import urlparse
from HTMLParser import HTMLParser

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from BeautifulSoup import BeautifulSoup
import lxml

app = Flask(__name__)

# To do:
# logging
# inline script url: value

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response


lookupUrlByKeyValue = {
    "img": ["src","data-deskscr","data-thumb","data-borealis-srcs","srcset"],
    "link": "href",
    "script": "src",
    "source": ["data-srcset","srcset"],
}

# lookupReplaceURL = {
#     "a": "href"
# }

lookupUrlByKeyContent = ["script"] ### /(\")[a-zA-Z0-9\.\/\?\:@\-_=#]+\.([a-zA-Z0-9\&\.\/\?\:@\-_=#])*(\")/g


def replaceContent(htmlContent, absoluteURL):
    content = BeautifulSoup(htmlContent)
    parsed_uri = urlparse(absoluteURL)
    baseURL = cleanUrl('{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri))

    def getAbsoluteUrl(strUrl, baseURL, absoluteURL):
        url = strUrl.strip()
        if(url.startswith("http") or url.startswith("#")):
            pass
        elif url.find("base64") >= 0:
            pass
        elif url.find("javascript:") >=0:
            pass
        elif not(url.startswith("//")) and (url.startswith("/")):
            url = url.replace(url, baseURL + url)
        elif not(url.startswith("//")) and (url.startswith("./")):
            url = url.replace(url, baseURL + url[1:])
        elif not(url.startswith("//")) and (url.startswith("..")):
            url = url.replace(url, urljoin(absoluteURL, url))
        elif not(url.startswith("//")) and len(re.findall("^[A-Za-z0-9]+", url)) > 0:
            url = url.replace(url, baseURL + "/" + url)
        return url


    def replaceUrlByKeyValue(content, key, value, removeURL=False):
        findTags = content.findAll(key)
        for eachTag in findTags:
            if eachTag!= None and eachTag.has_key(value):
                if((key== "link" and value == "href") or (key=="script" and value =="src") or (eachTag[value]).find("base64")>=0):
                    tagValueList = [eachTag[value]]
                else:
                    tagValueList = eachTag[value].split(",")
                for tagValue in tagValueList:
                    eachTag[value] = getAbsoluteUrl(tagValue, baseURL, absoluteURL)
                    if(removeURL==True):
                        if(value=="href"):
                            eachTag["tfHref"]=eachTag[value];
                            eachTag[value] = "javascript:void(0)"

    def replaceUrlByKeyContent(content, key):
        findTags = content.findAll(key)
        for eachTag in findTags:
            if(eachTag!=None) and len(eachTag.text)>0:
                # replace url in inline javascript
                regexURL = r"(\")[a-zA-Z0-9\.\/\?\:@\-_=#]+\.([a-zA-Z0-9\&\.\/\?\:@\-_=#])*(\")"
                for match in re.finditer(regexURL, eachTag.text):
                     matchedUrl = match.group()[1:-1]
                     newUrl = getAbsoluteUrl(matchedUrl, baseURL, absoluteURL)
                     eachTag.setString(eachTag.text[0:match.start()] + '"' + newUrl + '"' + eachTag.text[match.end():])


    #Search through all tagNames
    for key, value in lookupUrlByKeyValue.iteritems():
        if type(value) is str:
            replaceUrlByKeyValue(content, key, value)
        elif type(value) is list:
            for eachValue in value:
                replaceUrlByKeyValue(content, key, eachValue)

    for key in lookupUrlByKeyContent:
        replaceUrlByKeyContent(content,key)

    #Remove url
    # for key, value in lookupReplaceURL.iteritems():
        # replaceSrc(content, key, value, True)

    #Search through cases with url path in style element
    # content = re.sub("url\(\'\/", "url(\'"+ absoluteURL + "/", str(content))
    # content = re.sub("url\(\/", "url("+ absoluteURL + "/", content)
    content = re.sub("/(?!url\(\'\/\/)(url\(\'\/)/g", "url(\'" + absoluteURL + "/", str(content))
    content = re.sub("/(?!url\(\/\/)(url\(\/)/g", "url(\'" + absoluteURL + "/", str(content))

    return content


# clean the url
def cleanUrl(url):
    if url[-1]=="/":
        url = url[:-1]
    return url


def getContentFromUrl(url):
    browser = webdriver.Chrome()
    browser.get(url)
    delay = 3
    content = ""
    try:
        WebDriverWait(browser, delay)
        content = browser.page_source
    except TimeoutException:
        pass  # logging needed
    except:
        pass  # logging needed

    browser.quit()
    return content


#Endpoints
@app.route('/results',methods=['POST'])
def result_handler():
    reqUrl, reqComponents, output = "", [], {}
    reqData = request.json
    if(reqData.has_key('urlToTag')):
        url = reqData.get('urlToTag')
    if(reqData.has_key('componentToTag')):
        reqComponents = reqData.get('componentToTag')
    if(len(reqComponents)>0 and len(url)>0):
        content = getContentFromUrl(url)
        content = BeautifulSoup(content)
        componentList = []
        for eachComponent in reqComponents:
            component = {}
            component["name"] = eachComponent["name"]
            nodes = content.findAll(True, {"class": eachComponent["cssNames"]})
            nodeComponentList = []
            for eachNode in nodes:
                # Find all <a> element with href
                nodeComponent = {}
                listAHref = []
                for eachAHref in eachNode.findAll('a', href=True):
                    listAHref.append(eachAHref.get("href"))
                if(len(listAHref)>0):
                    nodeComponent["links"] = listAHref
                listImgSrc = []
                for eachImgSrc in eachNode.findAll('img', src=True):
                    listImgSrc.append(eachImgSrc.get("src"))
                if (len(listImgSrc) > 0):
                    nodeComponent["images"] = listImgSrc
                listText = []
                for eachText in eachNode.findAll(True, text=True):
                    listText.append(eachText)
                if (len(listText) > 0):
                    nodeComponent["texts"] = listText
                nodeComponentList.append(nodeComponent)
                component["results"] = nodeComponentList
            componentList.append(component)
        output["results"] = componentList

    return Response(
        json.dumps(output, ensure_ascii=False, encoding="utf-8"),
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache'
        }
    )


@app.route('/', methods=['GET'])
def curl_handler():
    url = request.args.get('url')
    content = getContentFromUrl(url)
    content = replaceContent(content, url)
    content = HTMLParser().unescape(content)
    return Response(
        content,
        mimetype='text/html',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )


if __name__ == '__main__':
    app.run(host='localhost',port=int(os.environ.get("PORT", 3800)),threaded=True)


# http://news.google.com
# http://www.nytimes.com
# https://www.bing.com/news
# https://sg.finance.yahoo.com/
# http://www.sina.com.cn/

# http://www.channelnewsasia.com
# { "url":"https://news.google.com/","request":[{"name":"ob-dynamic-rec-container_ob-recIdx-0_ob-p", "cssNames":["ob-dynamic-rec-container","ob-recIdx-0", "ob-p"]},{"name":"asian-voice__main-content", "cssNames":["asian-voice__main-content"]}]}
