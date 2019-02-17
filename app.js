'use strict';

/**
 * Скрывает элемент
 * @param {HTMLElement} el
 */
const hide = (el) => el.classList.add('hidden');

/**
 * Показывает элемент
 * @param {HTMLElement} el
 */
const show = (el) => el.classList.remove('hidden');

class Form {
	constructor(selector = 'form') {
		this.selector = selector;
		this.element = document.querySelector(this.selector);

		this.controls = [...this.element.querySelectorAll('.form-control')].map((el) => {
			const name = el.querySelector('input').getAttribute('name');

			return new FormControl(el, this.validationRules[name]);
		});
		this.submitButton = this.element.querySelector('button[type=submit]');

		this.submitButton.addEventListener('click', (e) => {
			e.preventDefault();

			this.validate();

			if (this.isValid) {
				this.submit();
			}
		});
	}

	get validationRules() {
		throw new Error('[Form] You must implement this getter in child class');
	}

	get isValid() {
		let result = true;

		for (let i = 0; i < this.controls.length; i++) {
			if (this.controls[i].error) {
				result = false;

				break;
			}
		}

		return result;
	}

	hide() {
		hide(this.element);
	}

	show() {
		show(this.element);
	}

	validate() {
		this.controls.forEach((control) => {
			const rule = this.validationRules[control.name];

			control.validate(rule);
		});
	}

	submit() {
		throw new Error('[Form] You must implement "submit" method in child class');
	}
}

class Validator {
	constructor(data, rules, messages = {}) {
		this.data = data;
		this.customRules = {};
		this.customMessages = messages;
		this.errors = {};

		this.validate(rules);
	}

	get isValid() {
		return !Object.keys(this.errors).length;
	}

	get errorsAll() {
		return Object.values(this.errors).map((row) => row.message).join('. ');
	}

	get rules() {
		return {
			required: (v) => {
				if (typeof v === 'string' || Array.isArray(v)) {
					return !!v.length;
				}

				if (typeof v === 'object' && v !== null) {
					return !!Object.keys(v).length;
				}
			},
			email: (v) => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(v).toLocaleLowerCase()),
			string: (v) => typeof v === 'string',
			alpha: (v) => /^[a-zA-Zа-яА-ЯёЁ]*$/.test(String(v)),
			number: (v) => typeof v === 'number',
			numeric: (v) => typeof v === 'number' || !isNaN(parseInt(v)),
			min: (v, min) => {
				if (typeof v === 'string') {
					return min <= v.length;
				}

				if (typeof v === 'number') {
					return min <= v;
				}

				console.warn('[Validator] The "min" rule working only with types: string, number');

				return true;
			},
			equals: (v, field) => v === this.data[field]
		};
	}

	get messages() {
		return Object.assign({
			required: () => 'Поле должно быть заполнено',
			string: () => 'Поле должно содержать строку',
			alpha: () => 'Поле должно содержать только буквы',
			email: () => 'Поле должно содержать адрес электронной почты',
			number: () => 'Поле должно содержать число',
			numeric: () => 'Поле должно содержать число',
			min: (v, min) => {
				if (typeof v === 'number') {
					return `Число должно быть не менее ${min}`
				}

				return `Строка должна быть не менее ${min} символов в длинну`;
			},
			equals: (v, field) => `Поле должно совпадать с полем "${this.translate(field)}"`
		}, this.customMessages);
	}

	get fields() {
		return {
			password: 'Пароль'
		};
	}

	validate(rules) {
		this.errors = {};

		const keys = Object.keys(this.data);

		for (let i = 0; i < keys.length; i++) {
			const name = keys[i];
			const value = this.data[name];
			const conditions = rules[name].split('|');

			for (let j = 0; j < conditions.length; j++) {
				let [rule, args] = conditions[j].split(':');

				args = args ? args.split(',') : [];

				let isValid = this.rules[rule](value, ...args);

				if (!isValid) {
					const message = this.messages[rule](value, ...args);

					this.createError(name, rule, message);

					break;
				}
			}
		}
	}

	createError(name, rule, message) {
		this.errors[name] = { rule, message };
	}

	translate(field) {
		return this.fields[field] || field;
	}

	registerRule(name, validator, message = null) {
		if (this.rules.hasOwnProperty(name)) {
			throw new Error(`[Validator] Rule with name "${name}" already exists`);
		}

		this.customRules[name] = validator;
	}
}

class RegistrationForm extends Form {
	constructor() {
		super('#register');

		this.onLoginClick = () => console.log('login click');

		this.element.querySelector('.text-center a').addEventListener('click', this.loginClickHandler.bind(this));
	}

	get validationRules() {
		return {
			name: 'required|alpha',
			email: 'required|email',
			password: 'required|string|min:6',
			// confirm_password: 'required|equals:password'
		};
	}

	loginClickHandler() {
		this.onLoginClick();
	}

	submit() {
		alert('Типо зарегистрировался');
	}
}

class AuthenticationForm extends Form {
	constructor() {
		super('#login');

		this.onRegisterClick = () => console.log('register click');
		this.onForgetPasswordClick = () => console.log('forget password click');

		this.element.querySelector('.form-actions a').addEventListener('click', this.forgetPasswordClickHandler.bind(this));
		this.element.querySelector('.text-center a').addEventListener('click', this.registerClickHandler.bind(this));
	}

	get validationRules() {
		return {
			email: 'required|email',
			password: 'required|string|min:6'
		};
	}

	forgetPasswordClickHandler() {
		this.onForgetPasswordClick();
	}

	registerClickHandler() {
		this.onRegisterClick();
	}

	submit() {
		alert('Типо авторизован');
	}
}

class ForgetPasswordForm extends Form {
	constructor() {
		super('#forget-password');

		this.onCancelClick = () => console.log('cancel click');

		this.element.querySelector('.form-actions button').addEventListener('click', this.cancelClickHandler.bind(this));
	}

	get validationRules() {
		return {
			email: 'required|email'
		};
	}

	cancelClickHandler() {
		this.onCancelClick();
	}

	submit() {
		alert('Типо восстановил пароль');
	}
}

class FormControl {
	constructor(el, rule) {
		this.element = el;
		this.hint = null;
		this.rule = rule;

		this.input = this.element.querySelector('input');
		this.input.addEventListener('blur', this.validate.bind(this));

		// Private variable
		this._error = false;
	}

	get value() {
		return this.input.value;
	}

	get name() {
		return this.input.getAttribute('name');
	}

	get error() {
		return this._error;
	}

	set error(value) {
		this._error = value;

		const errorClass = '-error';

		value
			? this.element.classList.add(errorClass)
			: this.element.classList.remove(errorClass);
	}

	validate() {
		const validator = new Validator({ value: this.value }, { value: this.rule });

		console.log(validator);

		this.error = !validator.isValid;
		this.error ? this.makeHint(validator.errorsAll) : this.removeHint();
	}

	makeHint(message) {
		if (typeof message !== 'string') {
			throw new Error('[FormControl] The "message" argument must be a string');
		}

		if (!this.hint) {
			this.hint = document.createElement('div');
			this.hint.classList.add('form-hint');
		}

		this.hint.innerText = message;

		this.element.appendChild(this.hint);
	}

	removeHint() {
		if (this.hint) {
			this.hint.remove();
		}
	}
}

class App {
	constructor() {
		this.registrationForm = new RegistrationForm();
		this.authenticationForm = new AuthenticationForm();
		this.forgetPasswordForm = new ForgetPasswordForm();

		this.authenticationForm.onForgetPasswordClick = () => {
			this.authenticationForm.hide();
			this.forgetPasswordForm.show();
		};

		this.authenticationForm.onRegisterClick = () => {
			this.authenticationForm.hide();
			this.registrationForm.show();
		};

		this.forgetPasswordForm.onCancelClick = () => {
			this.forgetPasswordForm.hide();
			this.authenticationForm.show();
		};

		this.registrationForm.onLoginClick = () => {
			this.registrationForm.hide();
			this.authenticationForm.show();
		};

		this.init();
	}

	init() {
		this.registrationForm.hide();
		this.forgetPasswordForm.hide();
		this.authenticationForm.show();
	}
}