# adapt-icon-popup

**Icon popup** is an *extension* for the [Adapt framework](https://github.com/adaptlearning/adapt_framework).   

This extension allows an Icon or button to be inserted into an Article, Block or Component which opens content in a popup or a URL in a new window.

## Installation

This extension must be manually installed.

If **Icon popup** has been uninstalled from the Adapt authoring tool, it may be reinstalled using the [Plug-in Manager](https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager).

## Settings Overview

**Icon popup** is configured on three levels: article (*articles.json*), block (*blocks.json*) and component (*components.json*).

The attributes listed below are properly formatted as JSON in [*example.json*](https://github.com/deltanet/adapt-icon-popup/blob/master/example.json).  

### Attributes

The Icon popup attribute group contains values for **_isEnabled**, **_classes**, **_audio**, and **_items**.

>**_isEnabled** (boolean):  Turns on and off the **Icon popup** extension. Can be set to disable **Icon popup** when not required.  

>**_classes** (string):  Defines a CSS class for a theme to reference.

>**_audio** (object):  This `_audio` attributes group stores the properties for audio functionality. It contains values for **_isEnabled**, and **_channel**.  

>>**_isEnabled** (boolean): If set to `true`, [audio](https://github.com/deltanet/adapt-audio) functionality can be used in the items.

>>**_channel** (number):  Defines the channel number for the [audio](https://github.com/deltanet/adapt-audio).

>**_items** (array):  This `_items` attributes group stores the properties for each button. It contains values for **_type**, **_setCompletion**, **_buttonTitle**, **_buttonIcon**, **_notifyGraphic**, **_buttonGraphic**, **_ariaLabels**,  **title**, **body**, **_itemGraphic**, **_audio**, and **_url**.  

>>**_type** (string): Defines what type of popup is used. Option are `Popup` and `URL`.

>>**_setCompletion** (boolean):  Defines whether the Article, Block or Component element should be set to complete when the item is viewed.

>>**_buttonTitle** (string): Sets the text on the button.

>>**_buttonIcon** (object):  This `_buttonIcon` attributes group stores the properties for an icon on the button. It contains values for **_isEnabled**, and **_icon**.  

>>>**_isEnabled** (boolean): If set to `true`, an icon will be used on the button.  

>>>**_icon** (string): Defines the CSS class for the button icon.  

>>**_notifyGraphic** (object):  This `_notifyGraphic` attributes group stores the properties for a notify graphic. It contains values for **src**.  

>>**alt** (string): This text becomes the image’s `alt` attribute.  

>>>**src** (string): File name (including path) of the image for the notify style popup. Path should be relative to the *src* folder.  

>>**_buttonGraphic** (object):  This `_buttonGraphic` attributes group stores the properties for an image used as the button. It contains values for **_isEnabled**, **src**, **srcHover**, **srcVisited**, and **alt**.  

>>>**_isEnabled** (boolean): If set to `true`, an image will be used as the button.  

>>>**src** (string): File name (including path) of the image for the button. Path should be relative to the *src* folder.

>>>**srcHover** (string): File name (including path) of the image for the button hover state. Path should be relative to the *src* folder.

>>>**alt** (string): This text becomes the image’s `alt` attribute.  

>>**_ariaLabels** (object): This `_ariaLabels` attributes group stores the accessibility properties for the button. It contains values for **openPopup**.  

>>>**openPopup** (string): This text becomes the image’s `aria label` attribute.  

>>**title** (string): This text becomes the item’s popup title.  

>>**body** (string): This text becomes the item’s body text.  

>>**_itemGraphic** (object):  This `_itemGraphic` attributes group stores the properties for an image used in the item popup. It contains values for **src**, and **alt**.  

>>>**src** (string): File name (including path) of the image in the item popup. Path should be relative to the *src* folder.

>>>**alt** (string): This text becomes the popup image’s `alt` attribute.

>>**_audio** (object): This `_audio` attributes group stores the audio properties for the item. It contains values for **src**.  

>>>**src** (string): File name (including path) of the audio for the item. Path should be relative to the *src* folder.  

>>**_url** (object): This `_url` attributes group stores the properties for the item url. It contains values for **_src**.  

>>>**_src** (string): This text becomes a url which will open in a new browser window.

## Limitations

No known limitations.

----------------------------
**Version number:**  2.1.3     
**Framework versions supported:**  2.0.4    
**Author / maintainer:** DeltaNet with [contributors](https://github.com/deltanet/adapt-icon-popup/graphs/contributors)     
**Accessibility support:** Yes  
**RTL support:** Yes  
**Authoring tool support:** yes
