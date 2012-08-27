<%-- 
    Document   : scripts
    Created on : Jul 21, 2011, 1:21:27 PM
    Author     : Ivan Suftin <isuftin@usgs.gov>
--%>

<%@page import="java.util.Enumeration"%>
<script type="text/javascript" src="js/cookie/cookie.js"></script>
<script type="text/javascript" src="js/log4javascript/log4javascript.js"></script>
<script type="text/javascript" src="js/jquery/jquery.js"></script>
<script type="text/javascript" src="js/xslt/jquery.xslt.js"></script>
<script type="text/javascript" src="js/xmlns/jquery.xmlns.js"></script>
<script type="text/javascript" src="js/objects/algorithm.js"></script>
<script type="text/javascript" src="js/constants.js"></script>
<script type="text/javascript" src="openlayers/OpenLayers.js"></script>
<script type="text/javascript" src="js/jquery-ui/jquery-ui-1.8.16.custom.min.js"></script>
<script type="text/javascript" src="js/jgrowl/jquery.jgrowl_compressed.js"></script> <%-- http://plugins.jquery.com/project/jGrowl --%>
<script type="text/javascript" src="js/colorbox/jquery.colorbox-min.js"></script>
<script type="text/javascript" src="js/parseUri/parseUri.js"></script>
<script type="text/javascript" src="js/parsexml/jquery.xmldom-1.0.min.js"></script>
<script type="text/javascript" src="js/fileuploader/fileuploader.js"></script>
<script type="text/javascript" src="js/download/download.jQuery.js"></script>
<script type="text/javascript" src="js/jquery-url-parser/jquery.url.js"></script>
<script type="text/javascript" src="js/wps.js"></script>
<script type="text/javascript" src="js/wfs.js"></script>
<script type="text/javascript" src="js/root.js"></script>
<script type="text/javascript" src="js/sciencebase.js"></script>
<script type="text/javascript" src="js/area_of_interest.js"></script>
<script type="text/javascript" src="js/dataset.js"></script>
<script type="text/javascript" src="js/map.js"></script>
<script type="text/javascript" src="js/tiptip/jquery.tipTip.js"></script>
<script type="text/javascript" src="js/excat/scripts/sarissa.js"></script>
<script type="text/javascript" src="js/excat/scripts/sarissa_ieemu_xpath.js"></script>
<script type="text/javascript" src="js/excat/scripts/cswclient.js"></script>
<script type="text/javascript">
    var incomingParams = {};
    <%
        Enumeration<String> paramNames = (Enumeration<String>) request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String key = paramNames.nextElement();
            String value = request.getParameter(key);
    %>
        incomingParams['<%=key%>'] = '<%=value%>'
    <%
        }
    %>
</script>