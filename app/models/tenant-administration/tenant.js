import BaseModel from '../../framework/base-model';
import DS from 'ember-data';

import env from 'twyr-webapp-server/config/environment';

import { computed } from '@ember/object';

export default BaseModel.extend({
	'name': DS.attr('string'),
	'subDomain': DS.attr('string'),

	'location': DS.belongsTo('tenant-administration/tenant-location', {
		'inverse': 'tenant'
	}),

	'fullDomain': computed('subDomain', {
		'get': function() {
			return `${window.location.protocol}//${this.get('subDomain')}${env.twyr.domain}:${window.location.port}`;
		},

		'set': function(key, value) {
			let newSubDomain = value.replace(`${window.location.protocol}//`, '').replace(env.twyr.domain, '').replace(`:${window.location.port}`, '').trim();
			if(newSubDomain === '')
				newSubDomain = `${window.location.protocol}//${this.get('subDomain')}${env.twyr.domain}:${window.location.port}`;
			else
				newSubDomain = value;

			this.set('subDomain', newSubDomain.replace(`${window.location.protocol}//`, '').replace(env.twyr.domain, '').replace(`:${window.location.port}`, '').trim());
			return newSubDomain;
		}
	})
});