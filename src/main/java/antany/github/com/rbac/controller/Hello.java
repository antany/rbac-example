package antany.github.com.rbac.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Hello {

	private static final Logger logger = LoggerFactory.getLogger(Hello.class);
	
	@GetMapping("/hello")
	public ResponseEntity<String> sayHello(@RequestParam(name = "name") String name){
		logger.info("Calling sayHello Method from {}",name);
		return ResponseEntity.ofNullable("Hello "+name);
	}
}
