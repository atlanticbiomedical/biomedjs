'use strict';

const email = require('emailjs');
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));
var config = require('../../config/config')['prod'];

const DEFAULT_HEADERS = {
  from: 'api@atlanticbiomedical.com'
};

function template(htmlFile, textFile, subjectTemplate, defaultValues) {
  if (_.isArray(defaultValues)) {
    defaultValues = _.reduce(defaultValues, (result, key) => {
      result[key] = '';
      return result;
    }, {});
  }

  const builder = template => {
    template = _.template(template);
    return (values) => {
      values = _.assign({}, defaultValues, values);
      return template(values);
    };
  };

  var htmlTemplate = fs.readFileAsync(path.join(__dirname, '../templates', htmlFile));
  var textTemplate = fs.readFileAsync(path.join(__dirname, '../templates', textFile));

  return Promise
    .props({
      html: htmlTemplate,
      text: textTemplate,
      subject: subjectTemplate
    })
    .then(templates => {
      return {
        html: builder(templates.html),
        text: builder(templates.text),
        subject: builder(templates.subject)
      }
    });
}

function send(headers, template, values) {
  var message = _.assign({}, DEFAULT_HEADERS, headers);
  message = prepairHeaders(message);

  return template.then(tmpl => {
    message.text = tmpl.text(values);
    message.subject = tmpl.subject(values);
    message.attachment = [
      {data: tmpl.html(values), alternative: true}
    ];

    const server = email.server.connect({
      user: config.email.user,
      password: config.email.password,
      host: 'smtp.gmail.com',
      ssl: true
    });

    return Promise.fromCallback(callback => {
      server.send(message, callback);
    });
  })
}

function prepairHeaders(headers) {
  return _.reduce(headers, (result, header, key) => {
    if (!_.isArray(header)) {
      header = [header];
    }

    if (key === 'subject') {
      result[key] = header;
    } else {
      result[key] = _
        .map(header, entry => {
          if (_.isPlainObject(entry)) {
            return `${entry.name} <${entry.email}>`;
          } else {
            return `<${entry}>`;
          }
        })
        .join(', ');
    }

    return result;
  }, {});
}

module.exports = {
  send,
  template
};
