package antany.github.com.rbac.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.embedded.jetty.JettyServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import jakarta.servlet.http.HttpServletRequest;

@Configuration
public class JettyAccessLog implements WebServerFactoryCustomizer<JettyServletWebServerFactory>{

	private static final Logger logger = LoggerFactory.getLogger(JettyAccessLog.class);
	
	@Override
	public void customize(JettyServletWebServerFactory factory) {
		factory.addServerCustomizers(server -> {
            server.setRequestLog((request, response) -> {
                String user = "-";
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();

                if (auth instanceof OAuth2AuthenticationToken token && auth.isAuthenticated()) {
                    Map<String, Object> attributes = token.getPrincipal().getAttributes();
                    user = (String) attributes.getOrDefault("preferred_username",
                            attributes.getOrDefault("name", token.getName()));
                }
                
                String address = request.getConnectionMetaData().getRemoteSocketAddress().toString();

                logger.info(address);
                
               // logger.info(request)
            });
        });

		
	}

}
