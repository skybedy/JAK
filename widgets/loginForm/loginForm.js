//FIXME ceske texty primo v kodu...
//FIXME co delaji ctecky pro nevidome s placeholderem? neni nutny label?

/**
 * @class Prihlasovaci okenko
 * @signal login-done
 */
JAK.LoginForm = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals],
	DEPEND: [
		{ sClass: JAK.Login, ver: "1.0" },
		{ sClass: JAK.Placeholder, ver: "2.0" },
		{ sClass: JAK.ModalWindow, ver: "1.0" }
	]
});

//musi probehnout pred koncem BODY
JAK.LoginForm.prototype.$constructor = function(conf) {
	this._conf = {
		serviceId: "",	//nutno vyplnit necim smysluplnym
		submitIframeUrl: ""	//url pro iframe, do ktereho se submitne form, nemelo by to nic udelat (obrazek,...)
	};
	for (var p in conf) { this._conf[p] = conf[p]; }

	if (!this._conf.submitIframeUrl) { throw new Error("No submitIframeUrl specified"); }

	this._ec = [];
	this._sc = [];
	this._dom = {};
	this._placeholder = null;
	this._visible = false;
	this._autofill = { //automaticky predvyplnene hodnoty formulare (login+password)
		name: "",
		pass: ""
	};		

	this._login = new JAK.Login({serviceId: this._conf.serviceId});
	this._buildSubmitIframe(); //iframe, do ktereho se odesle loginForm
	this._buildForm();

	//umisteni formu do modalwindow
	this._mw = new JAK.ModalWindow(this._dom.form, {winClass:"login", overlayClass:"login"});
	this._sc.push(this.addListener("mw-close", "_mwClose", this._mw));
	
	this._softHide(); //skryje form a pripravi ho pro zobrazeni
	JAK.Events.onDomReady(this, "_onDomReady");

	this._login.check().then(
		this._okCheck.bind(this),
		this._errorCheck.bind(this)
	);
}

JAK.LoginForm.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
	
	//zrusit modalwindow a dom elementy
	this._mw.$destructor();

	/* FIXME overit */
	if (this._dom.form) {
		this._dom.form.parentNode.removeChild(this._dom.form);
	}
	this._dom.iframe.parentNode.removeChild(this._dom.iframe);
}

JAK.LoginForm.prototype.show = function() {
	if (this._visible) { return; }
	this._visible = true;

	this._hideError();
	this._placeholder.setValue(this._autofill.user);
	this._dom.pass.value = this._autofill.pass;
	
	this._mw.open();
	this._dom.user.focus();
}

JAK.LoginForm.prototype.hide = function() {	
	if (!this._visible) { return; }
	this._visible = false;
	this._mw.close();
}

/**
 * Sem odesilame formular. To proto, aby si Safari zapamatovalo jeho jmeno/heslo :/
 */
JAK.LoginForm.prototype._buildSubmitIframe = function() {
	var id = JAK.idGenerator();

	if (JAK.Browser.client == "ie" && parseInt(JAK.Browser.version) < 9) {
		var iframe = JAK.mel("<iframe name='" + id + "'>");
	} else {
		var iframe = JAK.mel("iframe");
		iframe.setAttribute("name", id);
	}
	iframe.style.display = "none";

	document.body.insertBefore(iframe, document.body.firstChild);
	this._dom.iframe = iframe;
}

JAK.LoginForm.prototype._buildForm = function() {
	var name = this._dom.iframe.name;
	this._dom.form = JAK.mel("form", {id:"loginForm", target:name, action:this._conf.submitIframeUrl});
	this._dom.user = JAK.mel("input", {type:"text", name:"username"});
	this._dom.pass = JAK.mel("input", {type:"password", name:"password"});

	var submit = JAK.mel("input", {type:"submit", value:"Přihlásit"});

	this._dom.info = JAK.mel("p", {className:"info"});
	this._dom.error = JAK.mel("p", {className:"error", innerHTML:""});

	JAK.DOM.append([this._dom.form, this._dom.user, this._dom.pass, this._dom.error, submit, this._dom.info]);

	this._dom.info.innerHTML = "<a href='#'>Registrovat se</a> nebo <a href='#'>zaslat zapomenuté heslo</a>";

	this._ec.push(JAK.Events.addListener(this._dom.form, "submit", this, "_submit"));	
}

JAK.LoginForm.prototype._onDomReady = function() {
	setTimeout(this._onFormsReady.bind(this), 100);
}

/**
 * Touto dobou uz by mel byt formular predvyplneny automaticky ulozenym jmenem/heslem
 */
JAK.LoginForm.prototype._onFormsReady = function() {
	this._autofill.user = this._dom.user.value;
	this._autofill.pass = this._dom.pass.value;
	
	this._placeholder = new JAK.Placeholder(this._dom.user, "E-mailová adresa");
	if ("placeholder" in this._dom.pass) { this._dom.pass.placeholder = "Heslo"; }
}

/**
 * umistime prozatim form do elementu, ktery je pripnuty v DOMu 
 * - nutne pro automaticke predvyplneni hesel v nekterych prohlizecich
 */
JAK.LoginForm.prototype._softHide = function() {
	var placer = JAK.mel("div", {}, {
		position: "absolute",
		width: "1px",
		height: "1px",
		overflow: "hidden",
		top: "-5000px",
		left: "-5000px"
	});
	placer.appendChild(this._dom.form);

	document.body.insertBefore(placer, document.body.firstChild);
}

JAK.LoginForm.prototype._showError = function(text) {
	this._dom.error.innerHTML = text;
	this._dom.error.style.display = "";
	this._dom.user.focus();
}

JAK.LoginForm.prototype._hideError = function() {
	this._dom.error.innerHTML = "";
	this._dom.error.style.display = "none";
}

JAK.LoginForm.prototype._submit = function(e, elm) {
	this._hideError();
	this._login.login(
		this._placeholder.getValue(),
		this._dom.pass.value,
		false /* FIXME */
	).then(
		this._okLogin.bind(this),
		this._errorLogin.bind(this)
	);
}

JAK.LoginForm.prototype._okLogin = function(data) {
	if (data.status == 200) {
		this.makeEvent("login-done", {auto:false});
	} else {
		this._showError(data.statusMessage);
	}
}

JAK.LoginForm.prototype._errorLogin = function(reason) {
	this._showMessage(reason);
}

JAK.LoginForm.prototype._okCheck = function(logged) {
	if (!logged) { return; } /* neni prihlaseny, nic se nedeje */

	this._login.autologin().then( /* zavolame autologin */
		this._okAutologin.bind(this),
		this._errorAutologin.bind(this)
	);
}

JAK.LoginForm.prototype._errorCheck = function(reason) {
	/* FIXME asi nic, je to na pozadi? */
}

JAK.LoginForm.prototype._okAutologin = function(data) {
	if (data.status == 200) {
		this.makeEvent("login-done", {auto:true});
	} else {
		this._showError(data.statusMessage);
	}
}

JAK.LoginForm.prototype._errorAutologin = function(reason) {
	this._showMessage(reason);
}

JAK.LoginForm.prototype._mwClose = function(e) {
	this.hide();
}