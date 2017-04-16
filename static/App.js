var config = {
  settings: {
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
    borderWidth: 8,
    minItemHeight: 6,
    minItemWidth: 6,
    headerHeight: 8,
    dragProxyWidth: 300,
    dragProxyHeight: 200
  },
  content: [{
    type: 'column',
    content: [{
      type: 'react-component',
      component: 'SearchBar',
      height: 6
    }, {
      type: 'row',
      content: [{
        type: 'react-component',
        component: 'WebContent',
        title: 'Web Content',
        props: { hostname: 'http://localhost:3000/proxy',
          url: 'http://www.autodesk.com/' },
        width: 55
      }, {
        type: 'column',
        content: [{
          type: 'react-component',
          component: 'ToolContent',
          cssClass: 'toolContent',
          title: 'Interaction',
          props: { title: 'Interaction' },
          height: 35
        }, {
          type: 'react-component',
          component: 'ActivityContent',
          title: 'API Payload',
          props: { title: 'Payload' }
        }]
      }]
    }]
  }]
};

var myLayout = new GoldenLayout(config);

var WebContent = React.createClass({
  displayName: 'WebContent',

  getInitialState: function () {
    return { hostname: this.props.hostname, url: this.props.url };
  },
  componentWillMount: function () {
    this.props.glEventHub.on('alertUrlUpdate', this.refresh);
  },
  componentWillUnmount: function () {
    this.props.glEventHub.off('alertUrlUpdate', this.refresh);
  },
  refresh: function (url) {
    url = this.cleanURLSchema(url);
    if (this.state.url != url) {
      this.setState({ url: url });
      $("#WebContent").attr("src", this.state.hostname + "/?url=" + this.state.url);
    }
  },
  cleanURLSchema: function (url) {
    var prefix = "";
    if (!url.startsWith("http")) {
      prefix = "http://";
    }
    if (!url.startsWith("www.") && !url.startsWith("http")) {
      prefix += "www.";
    }
    return prefix + url;
  },
  render: function () {
    var style = {
      width: "100%",
      height: "100%",
      border: "none"
    };
    return React.createElement('iframe', { id: 'WebContent', src: this.state.hostname + "/?url=" + this.state.url, style: style, scrolling: 'yes' });
  }
});

var SearchBar = React.createClass({
  displayName: 'SearchBar',

  getInitialState: function () {
    return { url: '' };
  },
  handleSearch: function (e) {
    if (e.charCode == 13 || e.keyCode == 13) {
      this.state.url = e.target.value;
      this.props.glEventHub.emit('alertUrlUpdate', this.state.url);
    }
  },
  render: function () {
    return React.createElement(
      'div',
      null,
      React.createElement('input', { id: 'tfsearch', name: 'tfsearch', type: 'text', placeholder: 'Enter a URL. E.g. http://www.bbc.com', onKeyDown: this.handleSearch, autoComplete: 'off', autoFocus: true })
    );
  }
});

var ToolAttr = React.createClass({
  displayName: 'ToolAttr',

  getInitialState: function () {
    return {
      keyIndex: this.props.keyIndex,
      controlOptions: [{ key: '0', value: "String" }, { key: '1', value: 'Array' }]
    };
  },
  addToSelection: function () {
    // Change CSS of the Div in selection
    var node = ReactDOM.findDOMNode(this);
    var nodeClassList = node.classList;
    // check if current node is selected
    // if(nodeClassList.contains("layerSelected")){
    //   nodeClassList.remove("layerSelected");
    //   nodeClassList.add("layer");
    // }else{
    var parentNode = node.parentNode;
    var parentNodeChildren = parentNode.children;
    for (var i = 0; i < parentNodeChildren.length; i++) {
      var currentNode = parentNodeChildren[i];
      var currentNodeClassList = currentNode.classList;
      currentNodeClassList.remove("layerSelected");
      currentNodeClassList.add("layer");
      if (currentNode == node) {
        currentNodeClassList.remove("layer");
        currentNodeClassList.add("layerSelected");
      }
    }
    this.props.glEventHub.emit('alertSelectAttr', this.state.keyIndex);
    // }
  },
  setDowndownItem: function (event) {
    var keyIndex = this.props.keyIndex;
    var btnDropdown = $("#dropdown-btn" + keyIndex);
    var selection = event.target.text;
    btnDropdown.html(selection + ' <span class="caret"></span>');
  },
  render: function () {
    return React.createElement(
      'div',
      { className: 'row padding layer', name: 'divAttr', key: "divAttr" + this.state.keyIndex, onClick: this.addToSelection },
      React.createElement(
        'div',
        { className: 'col-md-1 col-sm-1' },
        React.createElement(
          'button',
          { type: 'button', className: 'text-toogle btn btn-default', key: "cssSelector" + this.state.keyIndex, 'data-toggle': 'collapse', 'data-target': "#cssSelector" + this.state.keyIndex + "Target", 'aria-expanded': 'false', 'aria-controls': "cssSelector" + this.state.keyIndex + "Target" },
          React.createElement('span', { className: 'text-collapsed glyphicon glyphicon-triangle-right', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'text-expanded glyphicon glyphicon-triangle-bottom', 'aria-hidden': 'true' })
        )
      ),
      React.createElement(
        'div',
        { className: 'col-md-8 col-sm-11' },
        React.createElement('input', { type: 'text', name: 'inputAttrName', className: 'maxWidth', key: "inputAttrName" + this.state.keyIndex })
      ),
      React.createElement(
        'div',
        { className: 'col-md-3 col-sm-12' },
        React.createElement(
          'div',
          { className: 'dropdown', key: "dropdown" + this.state.keyIndex, id: "dropdown" + this.state.keyIndex },
          React.createElement(
            'button',
            { className: 'btn btn-default dropdown-toggle maxWidth', type: 'button', id: "dropdown-btn" + this.state.keyIndex, 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'true' },
            'Select one ',
            React.createElement('span', { className: 'caret' })
          ),
          React.createElement(
            'ul',
            { className: 'dropdown-menu dropdown-menu-right', 'aria-labelledby': 'dropdown-menu', key: "dropdown-menu" + this.state.keyIndex },
            this.state.controlOptions.map(function (data, key) {
              return React.createElement(
                'li',
                { key: key, value: data.key, onClick: this.setDowndownItem },
                React.createElement(
                  'a',
                  { href: '#', className: 'label ' },
                  data.value
                )
              );
            }, this)
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'col-md-12 collapse', id: "cssSelector" + this.state.keyIndex + "Target" },
        React.createElement(
          'div',
          { className: 'well' },
          React.createElement(
            'span',
            { className: 'label label-default' },
            'Default'
          ),
          React.createElement(
            'span',
            { className: 'label label-primary' },
            'Primary'
          )
        )
      )
    );
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
  displayName: 'ToolAttrList',

  getInitialState: function () {
    var eventHub = this.props.glEventHub;
    var index = 0;
    var defaultToolAttr = React.createElement(ToolAttr, { key: index, keyIndex: index, glEventHub: eventHub });
    return {
      selectedAttr: null,
      attrList: [defaultToolAttr]
    };
  },
  componentWillMount: function () {
    this.props.glEventHub.on('alertAddAttr', this.actionAddAttr);
    this.props.glEventHub.on('alertSelectAttr', this.actionSelectAttr);
    this.props.glEventHub.on('alertRemoveAttr', this.actionRemoveAttr);
  },
  componentWillUnmount: function () {
    this.props.glEventHub.off('alertAddAttr', this.actionAddAttr);
    this.props.glEventHub.off('alertSelectAttr', this.actionSelectAttr);
    this.props.glEventHub.off('alertRemoveAttr', this.actionRemoveAttr);
  },
  getLastKeyIndex: function (list) {
    var listLength = list.length;
    if (listLength == 0) {
      return -1;
    } else {
      var lastElement = list[listLength - 1];
      return lastElement.props.keyIndex;
    }
  },
  actionSelectAttr: function (index) {
    var attrList = this.state.attrList;
    for (var i = 0; i < attrList.length; i++) {
      var attr = attrList[i];
      if (attr.props.keyIndex == index) {
        if (this.state.selectedAttr != attr) {
          this.state.selectedAttr = attr; //select
        } else {
          this.state.selectedAttr = null; //deselect
        }
      }
    }
  },
  actionAddAttr: function (index) {
    var eventHub = this.props.glEventHub;
    var attrList = this.state.attrList;
    var nextKeyIndex = this.getLastKeyIndex(attrList) + 1;
    attrList.push(React.createElement(ToolAttr, { key: nextKeyIndex, keyIndex: nextKeyIndex, glEventHub: eventHub }));
    this.setState({ attrList: attrList });
  },
  actionRemoveAttr: function (index) {
    var selectedAttr = this.state.selectedAttr;
    if (selectedAttr != null) {
      var attrList = this.state.attrList;
      var newAttrList = [];
      for (var i = 0; i < attrList.length; i++) {
        var attr = attrList[i];
        if (attr != selectedAttr) {
          newAttrList.push(attr);
        }
      }
      this.setState({ attrList: newAttrList });
    }
  },
  render: function () {
    var attrList = this.state.attrList;
    return React.createElement(
      'div',
      null,
      attrList
    );
  }
});

var ToolSettings = React.createClass({
  displayName: 'ToolSettings',

  addAttr: function () {
    this.props.glEventHub.emit('alertAddAttr', '');
  },
  removeAttr: function () {
    this.props.glEventHub.emit('alertRemoveAttr', '');
  },
  extract: function () {
    var doc = document.getElementById('WebContent').contentWindow.document;
    if (doc.getElementById("tfstyle") == undefined) {
      var iframeDocHead = doc.getElementsByTagName("head")[0];
      var link = doc.createElement("link");
      link.setAttribute("id", "tfstyle");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("type", "text/css");
      link.setAttribute("href", "/css/style.css");
      iframeDocHead.appendChild(link);
      doc.documentElement.onclick = function (e) {
        var x = e.clientX,
            y = e.clientY,
            elementMouseIsOver = doc.elementFromPoint(x, y);
        console.log(elementMouseIsOver);
        var classList = elementMouseIsOver.classList;
        var highlightStyle = "tfHighlight";
        if (classList.contains(highlightStyle)) {
          classList.remove(highlightStyle);
        } else {
          classList.add(highlightStyle);
        }
      };
    }
  },
  render: function () {
    return React.createElement(
      'div',
      { className: 'row no-gutters whitebg' },
      React.createElement(
        'button',
        { type: 'button', className: 'btn btn-default', 'aria-label': 'Left Align', onClick: this.addAttr },
        React.createElement('span', { className: 'glyphicon glyphicon-plus', 'aria-hidden': 'true' })
      ),
      React.createElement(
        'button',
        { type: 'button', className: 'btn btn-default', 'aria-label': 'Left Align', onClick: this.removeAttr },
        React.createElement('span', { className: 'glyphicon glyphicon-minus', 'aria-hidden': 'true' })
      ),
      React.createElement(
        'button',
        { type: 'button', className: 'btn btn-default', 'aria-label': 'Left Align', onClick: this.addAttr },
        React.createElement('span', { className: 'glyphicon glyphicon-import', 'aria-hidden': 'true' }),
        ' Add to Layer'
      ),
      React.createElement(
        'button',
        { type: 'button', className: 'btn btn-default', 'aria-label': 'Left Align', onClick: this.addAttr },
        React.createElement('span', { className: 'glyphicon glyphicon-export', 'aria-hidden': 'true' }),
        ' Remove from Layer'
      ),
      React.createElement(
        'button',
        { type: 'button', className: 'btn btn-default', 'aria-label': 'Left Align', onClick: this.extract },
        React.createElement('span', { className: 'glyphicon glyphicon-search', 'aria-hidden': 'true' }),
        ' Extract'
      )
    );
  }
});

var ToolContent = React.createClass({
  displayName: 'ToolContent',

  render: function () {
    var eventHub = this.props.glEventHub;
    return React.createElement(
      'div',
      null,
      React.createElement(ToolSettings, { glEventHub: eventHub }),
      React.createElement(ToolAttrList, { glEventHub: eventHub })
    );
  }
});

var ActivityContent = React.createClass({
  displayName: 'ActivityContent',

  render: function () {
    return React.createElement(
      'div',
      null,
      this.props.title
    );
  }
});

myLayout.registerComponent('WebContent', WebContent);
myLayout.registerComponent('ToolContent', ToolContent);
myLayout.registerComponent('ActivityContent', ActivityContent);
myLayout.registerComponent('SearchBar', SearchBar);
myLayout.on('itemCreated', function (item) {
  if (item.config.cssClass) {
    item.element.addClass(item.config.cssClass);
  }
});
myLayout.init();

var Header = React.createClass({
  displayName: 'Header',

  render: function () {
    var style = {
      marginLeft: "2rem",
      marginTop: "1.5rem",
      marginBottom: "0rem"
    };
    return React.createElement(
      'div',
      { style: style },
      React.createElement('img', { src: 'images/tf_logo.png' })
    );
  }
});

ReactDOM.render(React.createElement(Header, null), document.getElementById('content'));