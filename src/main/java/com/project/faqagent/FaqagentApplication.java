package com.project.faqagent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class FaqagentApplication {

	public static void main(String[] args) {
		String dbUrl = System.getenv("DATABASE_URL");
		if (dbUrl != null && dbUrl.trim().startsWith("postgres")) {
			try {
				URI uri = new URI(dbUrl.trim());
				if (uri.getUserInfo() != null) {
					String[] userInfo = uri.getUserInfo().split(":");
					System.setProperty("spring.datasource.username", userInfo[0]);
					if (userInfo.length > 1) {
						System.setProperty("spring.datasource.password", userInfo[1]);
					}
				}
				String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + 
						(uri.getPort() != -1 ? ":" + uri.getPort() : "") + 
						uri.getPath();
				System.setProperty("spring.datasource.url", jdbcUrl);
			} catch (Exception e) {
				System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
			}
		}
		// Force the port to 8080 to match the user's manual Railway configuration
		System.setProperty("server.port", "8080");
		
		SpringApplication.run(FaqagentApplication.class, args);
	}

}
