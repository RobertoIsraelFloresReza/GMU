package utez.edu.mx.tdsw.security.service;

import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.security.entity.UserDetailsImpl;
import utez.edu.mx.tdsw.services.users.UserService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserDetailsImplService implements UserDetailsService {
    private final UserService usersService;

    public UserDetailsImplService(UserService usersService) {
        this.usersService = usersService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Users> foundUser = usersService.findByEmail(username);
        if (foundUser.isPresent())
            return UserDetailsImpl.build(foundUser.get());
        throw new UsernameNotFoundException("UserNotFound");

    }
}
