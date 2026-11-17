package com.uniconnect.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(SocialMediaProperties.class)
public class SocialMediaConfiguration {
}
