/**
* @overview par podpurnych dom-related funkci
* @version 2.0
* @author zara
*/   

SZN.Dom = {}
SZN.Dom.Name = 'Dom';
SZN.Dom.version = 2.0;
SZN.ClassMaker.makeClass(SZN.Dom);

/**
 * Vytvori DOM node, je mozne rovnou zadat id, CSS tridu a styly
 * @param {String} tagName jmeno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className nazev CSS trid(y)
 * @param {Object} styleObj asociativni pole CSS vlastnosti a jejich hodnot
 */
SZN.Dom.create = function(tagName,id,className,styleObj) {
	var node = document.createElement(tagName);
	if (id) { node.id = id; }
	if (className) { node.className = className; }
	if (styleObj) for (p in styleObj) {
		node.style[p] = styleObj[p];
	}
	return node;
}
	
/**
 * Alias pro document.createTextNode
 * @param {String} str retezec s textem
 */
SZN.Dom.text = function(str) {
	return document.createTextNode(str);
}
	
/**
 * Propoji zadane DOM uzly
 * @param {Array} pole1...poleN libovolny pocet poli; pro kazde pole se vezme jeho prvni prvek a ostatni 
 *   se mu navesi jako potomci
 */
SZN.Dom.append = function() { /* takes variable amount of arrays */
	for (var i=0;i<arguments.length;i++) {
		var arr = arguments[i];
		var head = arr[0];
		for (var j=1;j<arr.length;j++) {
			head.appendChild(arr[j]);
		}
	}
}
	
/**
 * Otestuje, ma-li zadany DOM uzel danou CSS tridu
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 * @return true|false
 */
SZN.Dom.isClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Prida DOM uzlu CSS tridu. Pokud ji jiz ma, pak neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.isClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS tridu. Pokud ji nema, neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 */
SZN.Dom.removeClass = function(element,className) {
	var names = element.className.split(" ");
	var newClassArr = [];
	for (var i=0;i<names.length;i++) {
		if (names[i] != className) { newClassArr.push(names[i]); }
	}
	element.className = newClassArr.join(" ");
}

/**
 * Vymaze (removeChild) vsechny potomky daneho DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}
