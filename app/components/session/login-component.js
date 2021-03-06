import BaseComponent from '../../framework/base-component';
import env from 'twyr-webapp-server/config/environment';

import computedStyle from 'ember-computed-style';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import { task } from 'ember-concurrency';

export default BaseComponent.extend({
	router: inject('router'),

	attributeBindings: ['style'],
	style: computedStyle('display'),

	displayForm: 'loginForm',

	username: '',
	password: '',
	confirmPassword: '',
	firstName: '',
	lastName: '',
	mobileNumber: '',

	'display': computed('hasPermission', function() {
		return {
			'display': (this.get('hasPermission') ? 'none' : 'block'),
			'min-width': (this.get('hasPermission') ? '0rem' : '20rem')
		};
	}),

	init() {
		this._super(...arguments);
		this.set('permissions', ['registered']);
	},

	'doLogin': task(function* () {
		const notification = this.get('notification');

		notification.display({
			'type': 'info',
			'message': 'Logging you in...'
		});

		try {
			const loginResult = yield this.get('ajax').post('/session/login', {
				'dataType': 'json',
				'data': {
					'username': this.get('username'),
					'password': this.get('password')
				}
			});

			notification.display({
				'type': (loginResult.status < 400) ? 'success' : 'error',
				'message': loginResult.info.message,
				'error': loginResult.info.message
			});

			if(loginResult.nextAction === 'proceed') {
				this.get('currentUser').one('userDataUpdated', () => {
					const userData = this.get('currentUser').getUser();
					this.get('router').transitionTo(userData.defaultApplication);
				});

				window.TwyrApp.trigger('userChanged');
				return;
			}

			if(loginResult.nextAction === 'redirect') {
				const currentSubDomain = window.location.hostname.replace(env.twyr.domain, '');
				const newHref = window.location.href.replace(currentSubDomain, loginResult.redirectDomain);

				window.location.href = newHref;
				return;
			}

			if(loginResult.nextAction === 'choose') {
				notification.display({
					'type': 'info',
					'message': 'TBD: Allow user to choose tenant'
				});

				return;
			}
		}
		catch(err) {
			notification.display({
				'type': 'error',
				'error': err
			});
		}
	}).drop(),

	'resetPassword': task(function* () {
		const notification = this.get('notification');

		notification.display({
			'type': 'info',
			'message': 'Resetting your password...'
		});

		try {
			const resetPassResult = yield this.get('ajax').post('/session/reset-password', {
				'dataType': 'json',
				'data': {
					'username': this.get('username')
				}
			});

			notification.display({
				'type': (resetPassResult.status < 400) ? 'success' : 'error',
				'message': resetPassResult.message,
				'error': resetPassResult.message
			});
		}
		catch(err) {
			notification.display({
				'type': 'error',
				'error': err
			});
		}
	}).drop(),

	'registerAccount': task(function* () {
		const notification = this.get('notification');

		if(this.get('password') !== this.get('confirmPassword')) {
			notification.display({
				'type': 'error',
				'error': 'The passwords do not match'
			});

			return;
		}

		notification.display({
			'type': 'info',
			'message': 'Registering your account...'
		});

		try {
			const registerResult = yield this.get('ajax').post('/session/register-account', {
				'dataType': 'json',
				'data': {
					'firstname': this.get('firstName'),
					'lastname': this.get('lastName'),

					'username': this.get('username'),
					'mobileNumber': this.get('mobileNumber'),

					'password': this.get('password')
				}
			});

			notification.display({
				'type': (registerResult.status < 400) ? 'success' : 'error',
				'message': registerResult.message,
				'error': registerResult.message
			});
		}
		catch(err) {
			notification.display({
				'type': 'error',
				'error': err
			});
		}
	}).drop(),

	setDisplayForm(formName) {
		this.set('displayForm', formName);
	}
});
