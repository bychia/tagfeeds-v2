var config = {
  settings:{
      hasHeaders: false,
      constrainDragToContainer: true,
      reorderEnabled: true,
      selectionEnabled: false,
      popoutWholeStack: false,
      blockedPopoutsThrowError: false,
      closePopoutsOnUnload: true,
      showPopoutIcon: false,
      showMaximiseIcon: true,
      showCloseIcon: false
  },
  dimensions: {
        borderWidth: 10,
        minItemHeight: 8,
        minItemWidth: 8,
        headerHeight: 8,
        dragProxyWidth: 300,
        dragProxyHeight: 200
    },
  content: [
    {
      type:'column',
      content:[
        {
          type:'react-component',
          component: 'SearchBar',
          height: 6
        },
        {
        type: 'row',
        content: [
           {
            type:'react-component',
            component: 'WebContent',
            title: 'Web Content',
            props: {hostname: 'http://localhost:3000/proxy',
                    url: 'http://www.bbc.com/'},
            width: 55
          },
          {
           type:'column',
           content: [
             {
              type:'react-component',
              component: 'ToolContent',
              cssClass: 'toolContent',
              title: 'Interaction',
              props: {},
              height: 35
             },
             {
              type:'react-component',
              component: 'JSONContent',
              title: 'API Payload',
              props: {url: 'http://localhost:3000/example.json'}
             }
           ]
          }
        ]
      }]
    }]
};

var myLayout = new GoldenLayout( config );

var WebContent = React.createClass({
    getInitialState: function() {
        return { hostname: this.props.hostname, url: this.props.url };
    },
    componentWillMount: function() {
        this.props.glEventHub.on( 'alertUrlUpdate', this.refresh );
    },
    componentWillUnmount: function() {
        this.props.glEventHub.off( 'alertUrlUpdate', this.refresh );
    },
    refresh: function( url ) {
      url = this.suggestUrl(url);
      if(this.state.url != url){
        this.setState({url: url});
        $("#WebContent").attr("src", this.state.hostname + "/?url=" + this.state.url);
      }
    },
    suggestUrl: function(url){
      var prefix = "";
      if(!(url.startsWith("http"))){
        prefix = "http://";
      }
      if(!(url.startsWith("www.")) && !(url.startsWith("http"))){
        prefix += "www."
      }
      return (prefix+url);
    },
    render: function() {
      return (
        <iframe id="WebContent" src={this.state.hostname + "/?url=" + this.state.url} className="iframeNoBorder" scrolling="yes"></iframe>
      )
    }
});

var SearchBar = React.createClass({
  getInitialState: function() {
      return { url: '' };
  },
  handleSearch: function(e) {
      if (e.charCode == 13 || e.keyCode == 13) {
        this.state.url = e.target.value;
        this.props.glEventHub.emit( 'alertUrlUpdate', this.state.url );
      }
  },
  render: function() {
    return (
      <div>
        <input id="tfsearch" name="tfsearch" type="text" placeholder="Enter a URL. E.g. http://www.bbc.com" onKeyDown={this.handleSearch} autoComplete="off" autoFocus/>
      </div>
    )
  }
});


var ToolAttr = React.createClass({
  getInitialState: function() {
      return {
        keyIndex: this.props.keyIndex,
        name: this.props.name,
        cssNames: this.props.cssNames
      };
  },
  addToSelection: function(){
      // Change CSS of the Div in selection
      var node = ReactDOM.findDOMNode(this);
      var nodeClassList = node.classList;
      var parentNode = node.parentNode;
      var parentNodeChildren = parentNode.children;
      for(var i=0; i< parentNodeChildren.length; i++){
        var currentNode = parentNodeChildren[i];
        var currentNodeClassList = currentNode.classList;
        currentNodeClassList.remove("layerSelected");
        currentNodeClassList.add("layer");
        if(currentNode == node){
          currentNodeClassList.remove("layer");
          currentNodeClassList.add("layerSelected");
        }
      }
      this.props.glEventHub.emit( 'alertSelectAttr', this.state.keyIndex);
  },
  setDowndownItem: function(event){
    var keyIndex = this.props.keyIndex;
    var btnDropdown = $("#dropdown-btn"+keyIndex);
    var selection = event.target.text;
    btnDropdown.html(selection + ' <span class="caret"></span>');
  },
  render: function(){
      var cssNames = this.state.cssNames.split(" ");

      return (
        <div className="row padding layer" name="divAttr" key={"divAttr"+this.state.keyIndex} onClick={this.addToSelection}>
          <div className="col-md-1 col-sm-1">
            <button type="button" className="text-toogle btn btn-default" key={"cssSelector"+this.state.keyIndex} data-toggle="collapse" data-target={"#cssSelector"+this.state.keyIndex+"Target"} aria-expanded="false" aria-controls={"cssSelector"+this.state.keyIndex+"Target"}>
              <span className="text-collapsed glyphicon glyphicon-triangle-right" aria-hidden="true"/>
              <span className="text-expanded glyphicon glyphicon-triangle-bottom" aria-hidden="true"/>
            </button>
          </div>
          <div className="col-md-11 col-sm-11">
            <input type="text" name="inputAttrName" className="maxWidth" key={"inputAttrName"+this.state.keyIndex} defaultValue={this.state.name}/>
          </div>
          <div className="col-md-12 col-sd-12 collapse" id={"cssSelector"+this.state.keyIndex+"Target"}>
            <div className="col-md-12 col-sd-12 well">
              <div>
                {
                  cssNames.map(function(cssName, index){
                    return <span className="label label-success label-space" key={"cssLabel_"+index}>{cssName}</span>
                  })
                }
              </div>
            </div>
          </div>
        </div>
    )
  }
});

// <select name="selectAttrType" className="maxWidth" key={"selectAttrType"+this.state.keyIndex}>
//     {
//       this.state.controlOptions.map(function( data, key ){
//           return <option key={key} value={data.key}>{data.value}</option>
//       },this)
//     }
// </select>
// <div name="divAttr" key={"divAttr"+this.state.keyIndex}>
// <input type="text" name="inputAttrName" key={"inputAttrName"+this.state.keyIndex} />
// <input type="button" value="-" name="btnRemoveAttr" key={"btnRemoveAttr"+this.state.keyIndex} onClick={this.removeAttr}/>
// <select name="selectAttrType" key={"selectAttrType"+this.state.keyIndex}>
//     {
//       this.state.controlOptions.map(function( data, key ){
//           return <option key={key} value={data.key}>{data.value}</option>
//       },this)
//     }
// </select>
// <input type="submit" value="Extract" key={"btnExtract"+this.state.keyIndex} name="btnExtract"/>
// </div>

var ToolAttrList = React.createClass({
  getInitialState: function() {
      var eventHub = this.props.glEventHub;
      var index=-1;
      return {
        selectedAttr: null,
        attrList:[]
      };
  },
  componentWillMount: function() {
      this.props.glEventHub.on( 'alertAddAttr', this.actionAddAttr );
      this.props.glEventHub.on( 'alertSelectAttr', this.actionSelectAttr );
      this.props.glEventHub.on( 'alertRemoveAttr', this.actionRemoveAttr );
      this.props.glEventHub.on( 'alertRemoveSelectedAttr', this.actionRemoveSelectedAttr );
  },
  componentWillUnmount: function() {
      this.props.glEventHub.off( 'alertAddAttr', this.actionAddAttr );
      this.props.glEventHub.off( 'alertSelectAttr', this.actionSelectAttr );
      this.props.glEventHub.off( 'alertRemoveAttr', this.actionRemoveAttr );
      this.props.glEventHub.off( 'alertRemoveSelectedAttr', this.actionRemoveSelectedAttr );
  },
  getLastKeyIndex: function(list){
    var listLength = list.length;
    if(listLength==0){
      return -1
    }else{
      var lastElement = list[listLength-1];
      return lastElement.props.keyIndex;
    }
  },
  actionSelectAttr: function(index){
    var attrList = this.state.attrList;
    for(var i=0; i<attrList.length; i++){
      var attr = attrList[i];
      if(attr.props.keyIndex == index){
        if(this.state.selectedAttr != attr){
          this.state.selectedAttr = attr; //select
        } else {
          this.state.selectedAttr = null; //deselect
        }
      }
    }
  },
  actionAddAttr: function(attrName, cssNames) {
    var eventHub = this.props.glEventHub;
    var attrList = this.state.attrList;
    var nextKeyIndex = this.getLastKeyIndex(attrList)+1;
    attrList.push(<ToolAttr name={attrName} cssNames={cssNames} key={nextKeyIndex} keyIndex={nextKeyIndex} glEventHub={eventHub}/>);
    this.setState({attrList: attrList});
  },
  actionRemoveAttr: function (attrName){
      var attrList = this.state.attrList;
      var newAttrList = [];
      for(var i=0; i<attrList.length; i++){
        var attr = attrList[i];
        if(attr.props.name!=attrName){
          newAttrList.push(attr);
        }
      }
      this.setState({attrList: newAttrList});
  },
  actionRemoveSelectedAttr: function(){
      var selectedAttr = this.state.selectedAttr;
      if(selectedAttr!=null){
        var doc = document.getElementById('WebContent').contentWindow.document;
        var clickedStyle = "tfClicked";
        var props = selectedAttr.props;
        var cssNames = props.cssNames;
        var nodes = doc.getElementsByClassName(cssNames);
        for(var i=nodes.length-1; i>=0; i--){
          var node = nodes[i];
          node.classList.remove(clickedStyle);
        }
        this.actionRemoveAttr(props.name);
      }
  },
  render: function(){
      var attrList = this.state.attrList;
      return (
        <div>{attrList}</div>
      )
  }
});

var ToolSettings = React.createClass({
  checkAttr: function(className){

  },
  addAttr: function(attrName, cssNames){
      this.props.glEventHub.emit( 'alertAddAttr', attrName, cssNames);
  },
  removeAttr: function(attrName){
    this.props.glEventHub.emit( 'alertRemoveAttr', attrName);
  },
  removeSelectedAttr: function(){
    this.props.glEventHub.emit( 'alertRemoveSelectedAttr', "");
  },
  extract: function(){
    var _this = this;
    var doc = document.getElementById('WebContent').contentWindow.document;
    if(doc.getElementById("tfstyle")==undefined){
      var iframeDocHead = doc.getElementsByTagName("head")[0];
      var link = doc.createElement("link");
      link.setAttribute("id","tfstyle");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("type", "text/css");
      link.setAttribute("href", "/css/style.css");
      iframeDocHead.appendChild(link);
      var clickedStyle = "tfClicked";
      var mouseOverStyle = "tfMouseover";
      var removeClickedStyle = "tfRemoveClicked";

      var fnRemoveCss = function(){
        var mouseOverNodes = doc.getElementsByClassName(mouseOverStyle);
        for(var i=mouseOverNodes.length-1; i>=0; i--){
          var classList = mouseOverNodes[i].classList;
          classList.remove(mouseOverStyle);
        }
        var removeClickedNodes = doc.getElementsByClassName(removeClickedStyle);
        for(var i=removeClickedNodes.length-1; i>=0; i--){
          var classList = removeClickedNodes[i].classList;
          classList.remove(removeClickedStyle);
        }
      };

      var nodeWithClassAttr = function(node){
        if(node.hasAttribute("class") && node.getAttribute("class")!=""){
          return node;
        }else{
          return nodeWithClassAttr(node.parentElement);
        }
      };

      doc.documentElement.onmouseout = function(e){
        fnRemoveCss();
      };

      doc.documentElement.onmouseover = function(e){
        var x = e.clientX, y = e.clientY, elementSelected = doc.elementFromPoint(x, y);
        var node = nodeWithClassAttr(elementSelected);
        if(node.classList.contains(clickedStyle)){
            node.classList.add(removeClickedStyle);
        }else{
          node.classList.add(mouseOverStyle);
        }
      };

      doc.documentElement.onclick = function(e){
        fnRemoveCss();
        var x = e.clientX, y = e.clientY, elementSelected = doc.elementFromPoint(x, y);
        console.log("> "+elementSelected.className);
        var node = nodeWithClassAttr(elementSelected);
        console.log("> "+node.className);
        var className = node.className;
        var classList = node.classList;
        var isSelected = className.indexOf(clickedStyle) != -1? true: false;
        var allNodes = this.getElementsByClassName(className);

        for(var i=allNodes.length-1; i>-1; i--){
          var eachNode = allNodes[i];
          var eachNodeClassList = eachNode.classList;
          if(isSelected){
              eachNodeClassList.remove(clickedStyle);
          }else{
              eachNodeClassList.add(clickedStyle);
          }
        }

        if(isSelected){
          var newAttrName = node.className.replace(" ", "_");
          _this.removeAttr(newAttrName);
        }else{
          var cssNames = className.replace(clickedStyle,"");
          var newAttrName = cssNames.replace(" ", "_");
          _this.addAttr(newAttrName, cssNames);
        }

      };
    }
  },
  render: function(){
      return (
        <div className="row no-gutters whitebg">
          <button type="button" className="btn btn-default col-xs-4 col-sd-4 col-md-4" aria-label="Left Align" onClick={this.extract}>
            <span className="glyphicon glyphicon-search" aria-hidden="true"/> Extract
          </button>
          <button type="button" className="btn btn-default col-xs-4 col-sd-4 col-md-4" aria-label="Left Align" onClick={this.removeSelectedAttr}>
            <span className="glyphicon glyphicon-export" aria-hidden="true"/> Remove selected layer
          </button>
          <button type="button" className="btn btn-default col-xs-4 col-sd-4 col-md-4" aria-label="Left Align" onClick={this.removeSelectedAttr}>
            <span className="glyphicon glyphicon-open" aria-hidden="true"/> Remove all layers
          </button>
        </div>
      )
  }
});

var ToolContent = React.createClass({
  render: function(){
    var eventHub = this.props.glEventHub;
    return (
      <div><ToolSettings glEventHub={eventHub}/><ToolAttrList glEventHub={eventHub}/></div>
    )}
});


var JSONContent = React.createClass({
      formatJson: function(json) {
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          var cls = 'number';
          if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                  cls = 'key';
              } else {
                  cls = 'string';
              }
          } else if (/true|false/.test(match)) {
              cls = 'boolean';
          } else if (/null/.test(match)) {
              cls = 'null';
          }
          //return '<span class="' + cls + '">' + match + '</span>';
          return match;
      });
    },
    getInitialState: function() {
      var obj = {a:1, 'b':'foo', c:[false,'false',null, 'null', {d:{e:1.3e5,f:'1.3e5'}}]};
      var json = JSON.stringify(obj, undefined, 4);
      return { payload: json };
    },
    render: function() {
      return (
        // <iframe src={this.state.url} className="iframeNoBorder"></iframe>
        <pre name="JSONContent">{this.formatJson(this.state.payload)}</pre>
      )
    }
});

myLayout.registerComponent( 'WebContent', WebContent);
myLayout.registerComponent( 'ToolContent', ToolContent);
myLayout.registerComponent( 'JSONContent', JSONContent);
myLayout.registerComponent( 'SearchBar', SearchBar);
myLayout.on( 'itemCreated', function( item ){
  if( item.config.cssClass ){
    item.element.addClass( item.config.cssClass );
  }
});
myLayout.init();

var Header = React.createClass({
  render: function() {
    var style = {
      marginLeft: "2rem",
      marginTop: "1.5rem",
      marginBottom: "0rem"
    }
    return (
      <div style={style}><img src="images/tf_logo.png"/></div>
    )
  }
});


ReactDOM.render(
  <Header/>,
  document.getElementById('content')
);
