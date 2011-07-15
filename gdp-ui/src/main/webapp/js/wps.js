WPS = function() {

    function createWpsExecuteXML(wpsAlgorithm, stringInputs, xmlInputs, outputs, async) {
        var xml =
            '<?xml version="1.0" encoding="UTF-8"?> \
             <wps:Execute service="WPS" version="1.0.0" \
                 xmlns:wps="http://www.opengis.net/wps/1.0.0" \
                 xmlns:ows="http://www.opengis.net/ows/1.1" \
                 xmlns:xlink="http://www.w3.org/1999/xlink" \
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
                 xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 \
                 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd"> \
               <ows:Identifier>' + wpsAlgorithm + '</ows:Identifier> \
               <wps:DataInputs>';

        for (var stringProp in stringInputs) {

            for (var i = 0; i < stringInputs[stringProp].length; i++) {
                xml +=
                '<wps:Input> \
                   <ows:Identifier>' + stringProp + '</ows:Identifier> \
                   <wps:Data> \
                     <wps:LiteralData>' + stringInputs[stringProp][i] + '</wps:LiteralData> \
                   </wps:Data> \
                 </wps:Input>';
            }
        }

        for (var xmlProp in xmlInputs) {

            for (var j = 0; j < xmlInputs[xmlProp].length; j++) {
                xml +=
                '<wps:Input> \
                   <ows:Identifier>' + xmlProp + '</ows:Identifier>' +
                   xmlInputs[xmlProp][j] +
                '</wps:Input>';
            }
        }

        xml +=
              '</wps:DataInputs> \
               <wps:ResponseForm> \
                 <wps:ResponseDocument' + (async ? ' storeExecuteResponse="true" status="true"' : '') + '>';

        for (var k = 0; k < outputs.length; k++) {
            xml +=
                  '<wps:Output' + (async ? ' asReference="true"' : '') + '> \
                     <ows:Identifier>' + outputs[k] + '</ows:Identifier> \
                   </wps:Output>';

        }

        xml +=
                '</wps:ResponseDocument> \
               </wps:ResponseForm> \
             </wps:Execute>';

        return xml;
    }

    // Public members and methods
    return {
        getCapabilitiesParams: {'Request' : 'GetCapabilities', 'Service' : 'WPS', 'AcceptVersions' : '1.0.0', 'Language' : 'en-CA', 'Version' : '1.0.0'},
        describeProcessParams: function(processID) {
                return {'Request' : 'DescribeProcess', 'Service' : 'WPS', 'Identifier' : processID ,'AcceptVersions' : '1.0.0', 'Language' : 'en-CA', 'Version' : '1.0.0'};
            },
        processDescriptions: {},
        
        // Inputs should be an object with the key equaling the input identifier, and
        // the value equaling an array of data. Each value is required to be an array
        // so that all properties can be handled identically when creating the xml.
        sendWpsExecuteRequest: function(wpsEndpoint, wpsAlgorithm, stringInputs, outputs, async, callback, xmlInputs) {
            logger.debug('GDP: Sending WPS Execute request for algorithm: ' + wpsAlgorithm)
            $.ajax( {
                url : wpsEndpoint,
                type : 'post',
                data : createWpsExecuteXML(wpsAlgorithm, stringInputs, xmlInputs, outputs, async),
                processData : false,
                dataType : 'xml',
                contentType : 'text/xml',
                success : function(data, textStatus, XMLHttpRequest) {
                    callback(data);
                }
            });
        },

        sendWPSGetRequest: function(url, data, async, callback) {
            logger.debug("GDP: Sending WPS GET request to: " + url);
            $.ajax({
                url : url,
                type : 'get',
                data : data,
                async : async,
                contentType : 'text/xml',
                success : function(data, textStatus, XMLHttpRequest) {
                    callback(data);
                }
            });
        },

        // Creates the wps:Reference element which holds the WFS request
        createWfsWpsReference: function(wfsEndpoint, wfsXML) {
            var xml =
                '<wps:Reference xlink:href="' + wfsEndpoint + '"> \
                   <wps:Body>' +
                     wfsXML +
                  '</wps:Body> \
                 </wps:Reference>';

            return xml;
        },
        checkWpsResponse: function(response, message) {
            var success = $(response).find('ns|ExecuteResponse');

            if (success.length > 0) {
                 return true;
            } else {
                var error = $(response).find('ns|Exception');

                if (error.length > 0) {
                    var cause = $(response).find('ns|Exception[exceptionCode="JAVA_RootCause"] > ns|ExceptionText:eq(0)').text();
                    message += ' Cause: ' + cause;
                }

                showErrorNotification(message);
                hideThrobber();
                logger.error("GDP: A WPS error was encountered: " + message);
                return false;
            }
        }
    }
}