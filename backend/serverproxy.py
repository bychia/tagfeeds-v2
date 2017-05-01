import sys
reload(sys)
sys.setdefaultencoding('UTF8')

import os
from os.path import splitext
import requests
from BeautifulSoup import BeautifulSoup
from flask import Flask, Response, request
import re
try:
    from urlparse import urljoin  # Python2
    from urlparse import urlparse
except ImportError:
    from urllib.parse import urljoin  # Python3
    from urllib.parse import urlparse



app = Flask(__name__)

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response

def html_decode(s):
    """
    Returns the ASCII decoded version of the given HTML string. This does
    NOT remove normal HTML tags like <p>.
    """
    htmlCodes = (
            ("'", '&#39;'),
            ('"', '&quot;'),
            ('>', '&gt;'),
            ('<', '&lt;'),
            ('&', '&amp;')
        )
    for code in htmlCodes:
        s = s.replace(code[1], code[0])
    return s


lookupAbsoluteURL = {
    "img": ["src","data-deskscr","data-thumb","data-borealis-srcs"],
    "link": "href",
    "script": "src",
    "source": "data-srcset"
}

lookupReplaceURL = {
    "a": "href"
}


def replaceContent(htmlContent, absoluteURL):
    content = BeautifulSoup(htmlContent)
    parsed_uri = urlparse(absoluteURL)
    baseURL = cleanUrl('{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri))

    def replaceSrc(content, key, value, removeURL=False):
        findTags = content.findAll(key)
        for eachTag in findTags:
            if eachTag!= None and eachTag.has_key(value):
                tagValue = eachTag[value]
                if tagValue.find("http")==0 or tagValue.find("#")==0:
                    continue #skip
                elif tagValue.find("//")==-1 and tagValue.find("/")==0:
                    eachTag[value] = baseURL + tagValue
                elif tagValue.find("//")==-1 and tagValue.find("./")==0:
                    eachTag[value] = absoluteURL + tagValue[1:]
                elif tagValue.find("//")==-1 and tagValue.find("..")==0:
                    eachTag[value] = urljoin(absoluteURL, tagValue)
                elif tagValue.find("//")==-1 and len(re.findall("^[A-Za-z0-9]+",tagValue))>0:
                        eachTag[value] = absoluteURL + "/" + tagValue
                if(removeURL==True):
                    if(value=="href"):
                        eachTag["tfHref"]=eachTag[value];
                    # eachTag[value] = "javascript:void(0)"

    #Search through all tagNames
    for key, value in lookupAbsoluteURL.iteritems():
        if type(value) is str:
            replaceSrc(content, key, value)
        elif type(value) is list:
            for eachValue in value:
                replaceSrc(content, key, eachValue)

    #Remove url
    for key, value in lookupReplaceURL.iteritems():
        replaceSrc(content, key, value, True)

    #Search through cases with url path in style element
    content = re.sub("url\(\'\/", "url(\'"+ absoluteURL + "/", str(content))
    content = re.sub("url\(\/", "url("+ absoluteURL + "/", content)

    return content


# Get Web content of the required url
def getWebContent(url):
    try:
        req = requests.get(url)
        return req.content.decode('utf-8')
    except:
        return ""


# clean the url
def cleanUrl(url):
    if url[-1]=="/":
        url = url[:-1]
    return url


#Endpoints
@app.route('/results',methods=['POST'])
def result_handler():
    return Response(
        htmlContent,
        mimetype='text/html',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/', methods=['GET'])
def curl_handler():
    htmlContent = ""
    try:
        url = request.args.get('url')
        url = cleanUrl(url)
        htmlContent = getWebContent(url)
        htmlContent = replaceContent(htmlContent, url)
        htmlContent = html_decode(htmlContent)
    except:
        pass

    return Response(
        htmlContent,
        mimetype='text/html',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )


if __name__ == '__main__':
    app.run(host='localhost',port=int(os.environ.get("PORT", 3800)),threaded=True)
